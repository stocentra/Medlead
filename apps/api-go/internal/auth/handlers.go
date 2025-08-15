package auth

import (
	"bytes"
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/email"
	"github.com/stocentra/Medlead/api-go/internal/models"
	"github.com/stocentra/Medlead/api-go/internal/storage"
	"golang.org/x/crypto/bcrypt"
)

// Handlers holds dependencies for auth handlers.
type Handlers struct {
	Pool        *pgxpool.Pool
	Log         *log.Logger
	JWTSecret   string
	EmailClient *email.EmailClient
}

// RegisterRequest defines the extended JSON body for registration.
type RegisterRequest struct {
	Email             string  `json:"email"`
	Password          string  `json:"password"`
	FullName          string  `json:"full_name"`
	Country           string  `json:"country"`
	ProfessionalLevel string  `json:"professional_level"`
	PhoneNumber       *string `json:"phone_number,omitempty"`
	City              *string `json:"city,omitempty"`
}

// UpdateProfileRequest defines the fields that can be updated by the user.
type UpdateProfileRequest struct {
	FullName    *string `json:"full_name,omitempty"`
	NationalID  *string `json:"national_id,omitempty"`
	PhoneNumber *string `json:"phone_number,omitempty"`
}

// LoginRequest defines the expected JSON body for login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse defines the JSON response for a successful login.
type LoginResponse struct {
	AccessToken  string         `json:"access_token"`
	RefreshToken string         `json:"refresh_token"`
	User         models.Profile `json:"user"`
}

// RefreshResponse defines the response for a token refresh request.
type RefreshResponse struct {
	AccessToken string `json:"access_token"`
}

// ChangePasswordRequest defines the body for the change password request.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// Register now handles both required and optional fields.
func (h *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		h.Log.Println("Error hashing password:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		h.Log.Println("Error generating verification token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	verificationToken := hex.EncodeToString(tokenBytes)
	tokenExpiry := time.Now().Add(24 * time.Hour)
	newUserID := uuid.New()

	var countryDetails json.RawMessage
	if req.City != nil {
		cityMap := map[string]string{"city": *req.City}
		countryDetails, _ = json.Marshal(cityMap)
	}

	insertQuery := `
		INSERT INTO public.profiles 
			(id, email, password_hash, full_name, country, professional_level, email_verification_token, email_verification_token_expires_at, phone_number, country_specific_details) 
		VALUES 
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`

	_, err = h.Pool.Exec(context.Background(), insertQuery,
		newUserID, req.Email, string(hashedPassword), req.FullName, req.Country, req.ProfessionalLevel, verificationToken, tokenExpiry, req.PhoneNumber, countryDetails,
	)

	if err != nil {
		h.Log.Println("Error inserting new user:", err)
		http.Error(w, "Failed to create user (e.g., email already exists)", http.StatusInternalServerError)
		return
	}

	var createdUser models.Profile
	selectQuery := `
		SELECT 
			id, email, full_name, country, system_role, professional_level, verification_status,
			created_at, updated_at
		FROM public.profiles 
		WHERE id = $1`
	err = h.Pool.QueryRow(context.Background(), selectQuery, newUserID).Scan(
		&createdUser.ID, &createdUser.Email, &createdUser.FullName, &createdUser.Country,
		&createdUser.SystemRole, &createdUser.ProfessionalLevel, &createdUser.VerificationStatus,
		&createdUser.CreatedAt, &createdUser.UpdatedAt,
	)
	if err != nil {
		h.Log.Printf("Error fetching newly created user %s: %v", newUserID, err)
		http.Error(w, "Failed to retrieve user profile after creation", http.StatusInternalServerError)
		return
	}

	go func() {
		err := h.EmailClient.SendVerificationEmail(createdUser.Email, verificationToken)
		if err != nil {
			h.Log.Printf("Failed to send verification email to %s: %v", createdUser.Email, err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdUser)
}

// VerifyEmail handles the email verification link click.
// --- CRITICAL FIX APPLIED HERE ---
func (h *Handlers) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Verification token is missing", http.StatusBadRequest)
		return
	}

	// Corrected Logic: This query now ONLY clears the email verification token
	// and DOES NOT touch the 'verification_status'. This ensures that email
	// verification and identity verification are separate steps.
	query := `
		UPDATE public.profiles
		SET
			email_verification_token = NULL,
			email_verification_token_expires_at = NULL,
			updated_at = NOW()
		WHERE
			email_verification_token = $1 AND email_verification_token_expires_at > NOW()
		RETURNING id`

	var userID uuid.UUID
	err := h.Pool.QueryRow(context.Background(), query, token).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Invalid or expired verification token", http.StatusBadRequest)
		} else {
			h.Log.Println("Error verifying email token:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Email successfully verified. You can now log in to complete your profile verification.")
}

// Login handles user login and token issuance.
func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var user models.Profile
	// We also need to fetch the email verification token to check if email is verified
	query := `
		SELECT
			id, email, password_hash, full_name, country, professional_level,
			system_role, verification_status, email_verification_token, created_at, updated_at
		FROM public.profiles WHERE email = $1`
	err := h.Pool.QueryRow(context.Background(), query, req.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Country,
		&user.ProfessionalLevel, &user.SystemRole, &user.VerificationStatus, &user.EmailVerificationToken,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		} else {
			h.Log.Println("Error fetching user for login:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	// Corrected Logic: A user can log in as long as their email is verified
	// (i.e., the token has been cleared from the database).
	if user.EmailVerificationToken != nil {
		http.Error(w, "Email not verified. Please check your inbox for the verification link.", http.StatusForbidden)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	accessToken, err := GenerateAccessToken(user.ID, h.JWTSecret)
	if err != nil {
		h.Log.Println("Error generating JWT access token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	refreshToken, err := GenerateRefreshToken(user.ID, h.JWTSecret)
	if err != nil {
		h.Log.Println("Error generating JWT refresh token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	hashedRefreshToken, err := bcrypt.GenerateFromPassword([]byte(refreshToken), bcrypt.DefaultCost)
	if err != nil {
		h.Log.Println("Error hashing refresh token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	updateQuery := `UPDATE public.profiles SET refresh_token = $1 WHERE id = $2`
	_, err = h.Pool.Exec(context.Background(), updateQuery, string(hashedRefreshToken), user.ID)
	if err != nil {
		h.Log.Println("Error storing refresh token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	user.PasswordHash = ""
	user.EmailVerificationToken = nil // Don't send this to the client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// Refresh handles the token refresh logic.
func (h *Handlers) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID, err := ValidateToken(body.RefreshToken, h.JWTSecret)
	if err != nil {
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	var storedTokenHash sql.NullString
	query := `SELECT refresh_token FROM public.profiles WHERE id = $1`
	err = h.Pool.QueryRow(context.Background(), query, userID).Scan(&storedTokenHash)
	if err != nil || !storedTokenHash.Valid {
		http.Error(w, "Refresh token not found or invalid", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(storedTokenHash.String), []byte(body.RefreshToken))
	if err != nil {
		http.Error(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	newAccessToken, err := GenerateAccessToken(userID, h.JWTSecret)
	if err != nil {
		h.Log.Println("Error generating new access token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(RefreshResponse{AccessToken: newAccessToken})
}

// GetMe retrieves the full professional profile of the authenticated user.
func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
	if !ok {
		http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
		return
	}

	var profile models.Profile
	query := `
		SELECT
			id, email, full_name, country, system_role, professional_level, verification_status,
			national_id, gender, phone_number, university, student_id,
			medical_license_number, specialty_id, country_specific_details,
			created_at, updated_at
		FROM public.profiles
		WHERE id = $1`
	err := h.Pool.QueryRow(context.Background(), query, userID).Scan(
		&profile.ID, &profile.Email, &profile.FullName, &profile.Country, &profile.SystemRole,
		&profile.ProfessionalLevel, &profile.VerificationStatus, &profile.NationalID, &profile.Gender,
		&profile.PhoneNumber, &profile.University, &profile.StudentID, &profile.MedicalLicenseNumber,
		&profile.SpecialtyID, &profile.CountrySpecificDetails, &profile.CreatedAt, &profile.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User profile not found", http.StatusNotFound)
		} else {
			h.Log.Printf("Error fetching profile for user %s: %v", userID, err)
			http.Error(w, "Failed to fetch user profile", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

// ChangePassword handles the logic for updating a user's password.
func (h *Handlers) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
	if !ok {
		http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var currentPasswordHash string
	query := `SELECT password_hash FROM public.profiles WHERE id = $1`
	err := h.Pool.QueryRow(context.Background(), query, userID).Scan(&currentPasswordHash)
	if err != nil {
		h.Log.Printf("Error fetching user for password change %s: %v", userID, err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(currentPasswordHash), []byte(req.CurrentPassword))
	if err != nil {
		http.Error(w, "Invalid current password", http.StatusUnauthorized)
		return
	}

	newHashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		h.Log.Println("Error hashing new password:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	updateQuery := `UPDATE public.profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2`
	_, err = h.Pool.Exec(context.Background(), updateQuery, string(newHashedPassword), userID)
	if err != nil {
		h.Log.Printf("Error updating password for user %s: %v", userID, err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UploadVerificationDocument handles the verification document upload process.
func (h *Handlers) UploadVerificationDocument(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
	if !ok {
		http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil { // Max 10MB
		http.Error(w, "The uploaded file is too big. Please choose an image or PDF file smaller than 10MB.", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("document")
	if err != nil {
		http.Error(w, "Invalid file key in request. Expected 'document'.", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := filepath.Ext(handler.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".pdf" {
		http.Error(w, "Invalid file type. Only JPG, PNG, and PDF are allowed.", http.StatusUnsupportedMediaType)
		return
	}

	objectKey := fmt.Sprintf("verification-docs/%s/%s%s", userID.String(), uuid.New().String(), ext)

	uploader := r.Context().Value("uploader").(*storage.R2Uploader)
	err = uploader.UploadFile(r.Context(), userID, file, objectKey)
	if err != nil {
		h.Log.Printf("Error uploading file for user %s: %v", userID, err)
		http.Error(w, "Failed to upload document", http.StatusInternalServerError)
		return
	}

	tx, err := h.Pool.Begin(context.Background())
	if err != nil {
		h.Log.Printf("Error starting transaction for user %s: %v", userID, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(context.Background())

	insertDocQuery := `
		INSERT INTO public.user_verification_documents (user_id, storage_path)
		VALUES ($1, $2)`
	_, err = tx.Exec(context.Background(), insertDocQuery, userID, objectKey)
	if err != nil {
		h.Log.Printf("Error inserting document record for user %s: %v", userID, err)
		http.Error(w, "Failed to save document record", http.StatusInternalServerError)
		return
	}

	updateProfileQuery := `
		UPDATE public.profiles
		SET verification_status = 'pending', updated_at = NOW()
		WHERE id = $1`
	_, err = tx.Exec(context.Background(), updateProfileQuery, userID)
	if err != nil {
		h.Log.Printf("Error updating profile status for user %s: %v", userID, err)
		http.Error(w, "Failed to update user status", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(context.Background()); err != nil {
		h.Log.Printf("Error committing transaction for user %s: %v", userID, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"message": "Document uploaded successfully. Your submission is under review."})
}

// UpdateProfile handles updating the authenticated user's profile information.
func (h *Handlers) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
	if !ok {
		http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var query bytes.Buffer
	query.WriteString("UPDATE public.profiles SET updated_at = NOW()")
	args := []interface{}{userID}
	argCount := 2

	if req.FullName != nil {
		query.WriteString(fmt.Sprintf(", full_name = $%d", argCount))
		args = append(args, *req.FullName)
		argCount++
	}
	if req.NationalID != nil {
		query.WriteString(fmt.Sprintf(", national_id = $%d", argCount))
		args = append(args, *req.NationalID)
		argCount++
	}
	if req.PhoneNumber != nil {
		query.WriteString(fmt.Sprintf(", phone_number = $%d", argCount))
		args = append(args, *req.PhoneNumber)
		argCount++
	}

	if argCount == 2 {
		h.GetMe(w, r)
		return
	}

	query.WriteString(" WHERE id = $1 RETURNING id, email, full_name, country, system_role, professional_level, verification_status, national_id, gender, phone_number, university, student_id, medical_license_number, specialty_id, country_specific_details, created_at, updated_at")

	var updatedProfile models.Profile
	err := h.Pool.QueryRow(context.Background(), query.String(), args...).Scan(
		&updatedProfile.ID, &updatedProfile.Email, &updatedProfile.FullName, &updatedProfile.Country, &updatedProfile.SystemRole,
		&updatedProfile.ProfessionalLevel, &updatedProfile.VerificationStatus, &updatedProfile.NationalID, &updatedProfile.Gender,
		&updatedProfile.PhoneNumber, &updatedProfile.University, &updatedProfile.StudentID, &updatedProfile.MedicalLicenseNumber,
		&updatedProfile.SpecialtyID, &updatedProfile.CountrySpecificDetails, &updatedProfile.CreatedAt, &updatedProfile.UpdatedAt,
	)

	if err != nil {
		h.Log.Printf("Error updating profile for user %s: %v", userID, err)
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedProfile)
}

// GetNotifications retrieves all notifications for the authenticated user.
func (h *Handlers) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
	if !ok {
		http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
		return
	}

	query := `
		SELECT id, user_id, title, message, is_read, created_at
		FROM public.notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := h.Pool.Query(context.Background(), query, userID)
	if err != nil {
		h.Log.Printf("Error fetching notifications for user %s: %v", userID, err)
		http.Error(w, "Failed to retrieve notifications", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var notif models.Notification
		if err := rows.Scan(
			&notif.ID, &notif.UserID, &notif.Title, &notif.Message, &notif.IsRead, &notif.CreatedAt,
		); err != nil {
			h.Log.Printf("Error scanning notification row: %v", err)
			continue
		}
		notifications = append(notifications, notif)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notifications)
}
