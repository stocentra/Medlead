package server

import (
	"encoding/json"
	"net/http"

	"github.com/stocentra/Medlead/api-go/internal/auth"
)

// routes sets up all the API endpoints for the application.
func (app *App) routes() http.Handler {
	mux := http.NewServeMux()

	// Initialize auth handlers with all necessary dependencies from the app struct.
	authHandlers := &auth.Handlers{
		Pool:        app.Pool,
		Log:         app.Log,
		JWTSecret:   app.Config.JWTSecret,
		EmailClient: app.EmailClient,
	}

	// === PUBLIC AUTHENTICATION ROUTES ===
	mux.HandleFunc("POST /v1/auth/register", authHandlers.Register)
	mux.HandleFunc("POST /v1/auth/login", authHandlers.Login)
	mux.HandleFunc("GET /v1/auth/verify-email", authHandlers.VerifyEmail)

	// === PROTECTED ROUTES ===
	// The /v1/users/me route is protected by the authMiddleware.
	mux.Handle("GET /v1/users/me", app.authMiddleware(http.HandlerFunc(authHandlers.GetMe)))

	// === HEALTH CHECK ROUTE ===
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status":      "ok",
			"description": "Authentication service is up and running",
		})
	})

	return mux
}
