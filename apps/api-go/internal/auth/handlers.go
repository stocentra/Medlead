package auth

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// Handlers holds dependencies for auth handlers.
type Handlers struct {
	Pool      *pgxpool.Pool
	Log       *log.Logger
	JWTSecret string
}

// RegisterRequest defines the expected JSON body for registration.
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register handles new user registration.
func (h *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Hash the password securely
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		h.Log.Println("Error hashing password:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Create a new user profile
	newUser := models.Profile{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	// Insert the new user into the database
	query := `INSERT INTO public.profiles (id, email, password_hash) VALUES ($1, $2, $3)`
	_, err = h.Pool.Exec(context.Background(), query, newUser.ID, newUser.Email, newUser.PasswordHash)
	if err != nil {
		h.Log.Println("Error inserting new user:", err)
		// Here you would check for specific errors, like duplicate email
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Do not return password hash
	newUser.PasswordHash = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newUser)
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

	// Fetch user by email
	var user models.Profile
	query := `SELECT id, email, password_hash FROM public.profiles WHERE email = $1`
	err := h.Pool.QueryRow(context.Background(), query, req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		} else {
			h.Log.Println("Error fetching user for login:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	// Compare the provided password with the stored hash
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, err := GenerateToken(user.ID, h.JWTSecret)
	if err != nil {
		h.Log.Println("Error generating JWT token:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Do not return password hash
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
			id, email, full_name, national_id, gender, country, phone_number, 
			system_role, professional_level, university, student_id, 
			medical_license_number, specialty_id, verification_status, 
			country_specific_details, created_at, updated_at 
		FROM public.profiles 
		WHERE id = $1`

	// pgx uses QueryRow(...).Scan(...) which returns a single error
	err := h.Pool.QueryRow(context.Background(), query, userID).Scan(
		&profile.ID, &profile.Email, &profile.FullName, &profile.NationalID, &profile.Gender,
		&profile.Country, &profile.PhoneNumber, &profile.SystemRole,
		&profile.ProfessionalLevel, &profile.University, &profile.StudentID,
		&profile.MedicalLicenseNumber, &profile.SpecialtyID, &profile.VerificationStatus,
		&profile.CountrySpecificDetails, &profile.CreatedAt, &profile.UpdatedAt,
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
