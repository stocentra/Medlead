package server

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/stocentra/Medlead/api-go/internal/auth"
	"github.com/stocentra/Medlead/api-go/internal/models"
)

// corsMiddleware adds CORS headers to every response.
func (app *App) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// authMiddleware verifies the JWT token for protected routes.
func (app *App) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			http.Error(w, "Bearer token required", http.StatusUnauthorized)
			return
		}

		userID, err := auth.ValidateToken(tokenString, app.Config.JWTSecret)
		if err != nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), models.UserContextKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// adminMiddleware checks if the user has the 'admin' role.
// It should be chained after the authMiddleware.
func (app *App) adminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
		if !ok {
			http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
			return
		}

		var role string
		query := "SELECT system_role FROM public.profiles WHERE id = $1"
		err := app.Pool.QueryRow(context.Background(), query, userID).Scan(&role)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if role != "admin" {
			http.Error(w, "Forbidden: Administrator access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// verificationMiddleware checks if the user's identity has been verified.
// It should be chained after authMiddleware.
func (app *App) verificationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
		if !ok {
			http.Error(w, "Could not retrieve user ID from context", http.StatusInternalServerError)
			return
		}

		var status string
		query := "SELECT verification_status FROM public.profiles WHERE id = $1"
		err := app.Pool.QueryRow(context.Background(), query, userID).Scan(&status)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if status != "verified" {
			http.Error(w, "Forbidden: User identity has not been verified", http.StatusForbidden)
			return
		}

		// If user is verified, proceed to the next handler
		next.ServeHTTP(w, r)
	})
}

// auditLogMiddleware logs admin actions to the database.
func (app *App) auditLogMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)

		adminID, ok := r.Context().Value(models.UserContextKey).(uuid.UUID)
		if !ok {
			app.Log.Println("Audit log failed: could not get adminID from context")
			return
		}

		action := fmt.Sprintf("%s_%s", r.Method, strings.ReplaceAll(r.URL.Path, "/", "_"))

		targetID := r.PathValue("userID")
		if targetID == "" {
			targetID = r.PathValue("codeID")
		}

		ip, _, _ := net.SplitHostPort(r.RemoteAddr)

		query := `
            INSERT INTO public.audit_logs (admin_id, action, target_id, ip_address)
            VALUES ($1, $2, $3, $4)
        `
		_, err := app.Pool.Exec(context.Background(), query, adminID, action, targetID, ip)
		if err != nil {
			app.Log.Printf("Failed to write to audit log: %v", err)
		}
	})
}
