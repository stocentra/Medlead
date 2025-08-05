package server

import (
	"encoding/json"
	"net/http"

	"github.com/stocentra/Medlead/api-go/internal/auth"
)

func (app *App) routes() http.Handler {
	mux := http.NewServeMux()

	// Initialize auth handlers with dependencies from the app struct
	authHandlers := &auth.Handlers{
		DB:   app.DB,
		Pool: app.Pool, // Add this line - pass the connection pool
		Log:  app.Log,
	}

	// === PUBLIC AUTHENTICATION ROUTES ===
	mux.HandleFunc("POST /v1/auth/register", authHandlers.Register)
	mux.HandleFunc("POST /v1/auth/login", authHandlers.Login)

	// === PROTECTED ROUTES ===
	// This route requires a valid JWT and is protected by the authMiddleware.
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
