package server

import (
	"context"
	"net/http"
	"strings"

	"github.com/stocentra/Medlead/api-go/internal/auth"
	"github.com/stocentra/Medlead/api-go/internal/models"
)

// authMiddleware protects routes requiring authentication by validating the JWT.
func (app *App) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			http.Error(w, "Authorization header format must be Bearer {token}", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Validate the token using our JWT helper
		userID, err := auth.ValidateToken(tokenString, app.Config.JWTSecret)
		if err != nil {
			app.Log.Printf("Invalid token: %v", err)
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Add the user ID to the request context
		ctx := context.WithValue(r.Context(), models.UserContextKey, userID)

		// Serve the next handler with the new context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
