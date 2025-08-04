// In: internal/server/middleware.go

package server

import (
	"context"
	"net/http"
	"strings"

	"github.com/stocentra/Medlead/api-go/internal/models"
)

// authMiddleware protects routes requiring authentication.
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

		token := parts[1]

		// Create a new client instance configured with the user's token.
		authedClient := app.DB.Auth.WithToken(token)

		// Get the user information using the token.
		user, err := authedClient.GetUser()
		if err != nil {
			app.Log.Printf("Error verifying token: %v", err)
			http.Error(w, "Invalid authentication token", http.StatusUnauthorized)
			return
		}

		// Add the user object to the request context.
		ctx := context.WithValue(r.Context(), models.UserContextKey, user)

		// Serve the next handler with the new context.
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
