// In: internal/auth/handlers.go
package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/email"
	"github.com/stocentra/Medlead/api-go/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// Handlers holds dependencies for auth handlers.
type Handlers struct {
	Pool        *pgxpool.Pool
	Log         *log.Logger
	JWTSecret   string
	EmailClient *email.EmailClient
}

// RegisterRequest defines the expected JSON body for registration.
type RegisterRequest struct {
	Email             string `json:"email"`
	Password          string `json:"password"`
	FullName          string `json:"full_name"`
	Country           string `json:"country"`
	ProfessionalLevel string `json:"professional_level"`
}

// Register now correctly inserts all required fields and returns the full profile.
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

	// --- THE FIX IS HERE ---
	// The INSERT statement now includes all fields from the request.
	insertQuery := `
		INSERT INTO public.profiles 
			(id, email, password_hash, full_name, country, professional_level, email_verification_token, email_verification_token_expires_at) 
		VALUES 
			($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err = h.Pool.Exec(context.Background(), insertQuery,
		newUserID, req.Email, string(hashedPassword), req.FullName, req.Country, req.ProfessionalLevel, verificationToken, tokenExpiry,
	)

	if err != nil {
		h.Log.Println("Error inserting new user:", err)
		http.Error(w, "Failed to create user (e.g., email already exists)", http.StatusInternalServerError)
		return
	}

	// SELECT the complete profile to get all fields, including DB defaults
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

	// Send the verification email
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
func (h *Handlers) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Verification token is missing", http.StatusBadRequest)
		return
	}

	// Find the user with the given token, update their status, and clear the token details
	query := `
		UPDATE public.profiles
		SET
			verification_status = 'verified',
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

	// In a real application, you would redirect to a "success" page on your frontend.
	// For now, we just return a success message.
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Email successfully verified. You can now log in.")
}

// LoginRequest defines the expected JSON body for login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse defines the JSON response for a successful login.
type LoginResponse struct {
	AccessToken string         `json:"access_token"`
	User        models.Profile `json:"user"`
}

// Login handles user login and token issuance.
func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var user models.Profile
	query := `
		SELECT
			id, email, password_hash, full_name, country, professional_level,
			system_role, verification_status, created_at, updated_at
		FROM public.profiles WHERE email = $1`

	err := h.Pool.QueryRow(context.Background(), query, req.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Country,
		&user.ProfessionalLevel, &user.SystemRole, &user.VerificationStatus,
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

	// Check if email is verified before allowing login
	if user.VerificationStatus != "verified" {
		http.Error(w, "Email not verified. Please check your inbox for the verification link.", http.StatusForbidden)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := GenerateToken(user.ID, h.JWTSecret)
	if err != nil {
		h.Log.Println("Error generating JWT token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	user.PasswordHash = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(LoginResponse{
		AccessToken: token,
		User:        user,
	})
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
