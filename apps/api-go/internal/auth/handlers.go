package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/stocentra/Medlead/api-go/internal/models"
	supa "github.com/supabase-community/supabase-go"

	// CORRECTED IMPORT PATH: types are from gotrue, not supabase
	"github.com/supabase-community/gotrue-go/types"
)

// Handlers holds dependencies for auth handlers.
type Handlers struct {
	DB  *supa.Client
	Log *log.Logger
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

// GetMe retrieves the profile of the currently authenticated user.
func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(*types.UserResponse)
	if !ok || user == nil {
		h.Log.Println("Could not retrieve user from context in handler")
		http.Error(w, "Could not retrieve user from context", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user)
}
