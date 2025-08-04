// In: internal/auth/handlers.go
package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/stocentra/Medlead/api-go/internal/models"
	"github.com/supabase-community/gotrue-go/types"
	supa "github.com/supabase-community/supabase-go"
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

// GetMe retrieves the full professional profile of the authenticated user.
func (h *Handlers) GetMe(w http.ResponseWriter, r *http.Request) {
	// Step 1: Get the authenticated user from the context.
	authUser, ok := r.Context().Value(models.UserContextKey).(*types.UserResponse)
	if !ok || authUser == nil {
		h.Log.Println("Could not retrieve authenticated user from context")
		http.Error(w, "Could not retrieve user from context", http.StatusInternalServerError)
		return
	}

	// Step 2: Fetch the user's profile from the 'profiles' table.
	// The .Single() method returns a single JSON object, not an array.
	data, _, err := h.DB.From("profiles").
		Select("*", "exact", false).
		Eq("id", authUser.ID.String()).
		Single().
		Execute()

	if err != nil {
		h.Log.Printf("Error fetching profile for user %s: %v", authUser.ID, err)
		http.Error(w, "Failed to fetch user profile", http.StatusInternalServerError)
		return
	}

	// --- THE FIX IS HERE ---
	// Step 3: Unmarshal the raw data into a single Profile struct, not a slice.
	var profile models.Profile
	if err := json.Unmarshal(data, &profile); err != nil {
		h.Log.Printf("Error unmarshalling profile data: %v", err)
		http.Error(w, "Failed to process user profile data", http.StatusInternalServerError)
		return
	}

	// Step 4: Return the complete profile as the response.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}
