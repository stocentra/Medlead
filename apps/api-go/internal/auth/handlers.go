// In: internal/auth/handlers.go
package auth

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool" // Import pgxpool
	"github.com/stocentra/Medlead/api-go/internal/models"
	"github.com/supabase-community/gotrue-go/types"
	supa "github.com/supabase-community/supabase-go"
)

// Handlers holds dependencies for auth handlers.
type Handlers struct {
	DB   *supa.Client  // For Auth operations (login, register)
	Pool *pgxpool.Pool // For direct database queries (fetching profiles)
	Log  *log.Logger
}

// credentials is a struct for decoding login requests.
type credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register handles new user registration.
func (h *Handlers) Register(w http.ResponseWriter, r *http.Request) {
	var params types.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	resp, err := h.DB.Auth.Signup(params)
	if err != nil {
		h.Log.Printf("Error during registration: %v", err)
		http.Error(w, "Registration failed", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// Login handles user login and token issuance.
func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	session, err := h.DB.Auth.SignInWithEmailPassword(creds.Email, creds.Password)
	if err != nil {
		h.Log.Printf("Error during login: %v", err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(session)
}

// GetMe retrieves the full professional profile of the authenticated user.
func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	// Step 1: Get the authenticated user from the context.
	// This part is handled by the middleware and doesn't change.
	authUser, ok := r.Context().Value(models.UserContextKey).(*types.UserResponse)
	if !ok || authUser == nil {
		http.Error(w, "Could not retrieve user from context", http.StatusInternalServerError)
		return
	}

	// Step 2: Fetch the user's profile from the 'profiles' table using pgx.
	var profile models.Profile
	query := `
		SELECT 
			id, full_name, national_id, gender, country, phone_number, 
			system_role, professional_level, university, student_id, 
			medical_license_number, specialty_id, verification_status, 
			country_specific_details, created_at, updated_at 
		FROM public.profiles 
		WHERE id = $1`

	err := h.Pool.QueryRow(context.Background(), query, authUser.ID).Scan(
		&profile.ID, &profile.FullName, &profile.NationalID, &profile.Gender,
		&profile.Country, &profile.PhoneNumber, &profile.SystemRole,
		&profile.ProfessionalLevel, &profile.University, &profile.StudentID,
		&profile.MedicalLicenseNumber, &profile.SpecialtyID, &profile.VerificationStatus,
		&profile.CountrySpecificDetails, &profile.CreatedAt, &profile.UpdatedAt,
	)

	if err != nil {
		h.Log.Printf("Error fetching profile for user %s from pooler: %v", authUser.ID, err)
		http.Error(w, "Failed to fetch user profile", http.StatusInternalServerError)
		return
	}

	// Step 3: Return the complete profile as the response.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}
