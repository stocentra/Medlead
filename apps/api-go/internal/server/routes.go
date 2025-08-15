// In: apps/api-go/internal/server/routes.go
package server

import (
	"context"
	_ "embed" // CRITICAL FIX: Importing with a blank identifier for its side effect.
	"encoding/json"
	"net/http"

	"github.com/stocentra/Medlead/api-go/internal/admin"
	"github.com/stocentra/Medlead/api-go/internal/auth"
	"github.com/stocentra/Medlead/api-go/internal/storage"
)

//go:embed web/index.html
var indexHTML []byte // There must be NO blank line between the embed directive and this var.

// addUploaderToContext is a small middleware to make the uploader available in handlers.
func addUploaderToContext(uploader *storage.R2Uploader, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "uploader", uploader)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (app *App) routes() http.Handler {
	mux := http.NewServeMux()

	authHandlers := &auth.Handlers{
		Pool:        app.Pool,
		Log:         app.Log,
		JWTSecret:   app.Config.JWTSecret,
		EmailClient: app.EmailClient,
	}

	adminHandlers := &admin.Handlers{
		Pool: app.Pool,
		Log:  app.Log,
	}

	// --- Root Handler for the HTML page ---
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write(indexHTML)
	})

	// --- PUBLIC ROUTES ---
	mux.HandleFunc("POST /v1/auth/register", authHandlers.Register)
	mux.HandleFunc("POST /v1/auth/login", authHandlers.Login)
	mux.HandleFunc("POST /v1/auth/refresh", authHandlers.Refresh)
	mux.HandleFunc("GET /v1/auth/verify-email", authHandlers.VerifyEmail)

	// --- PROTECTED USER ROUTES ---
	userMux := http.NewServeMux()

	userMux.HandleFunc("POST /v1/users/upload-document", authHandlers.UploadVerificationDocument)
	userMux.HandleFunc("GET /v1/users/notifications", authHandlers.GetNotifications)

	// A single handler for /users/me that dispatches based on HTTP method
	meHandler := app.verificationMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			authHandlers.GetMe(w, r)
		case http.MethodPatch:
			authHandlers.UpdateProfile(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	}))
	userMux.Handle("/v1/users/me", meHandler)

	// A separate handler for changing password
	changePasswordHandler := app.verificationMiddleware(http.HandlerFunc(authHandlers.ChangePassword))
	userMux.Handle("POST /v1/users/change-password", changePasswordHandler)

	protectedUserHandler := app.authMiddleware(addUploaderToContext(app.Uploader, userMux))
	mux.Handle("/v1/users/", protectedUserHandler)

	// --- PROTECTED ADMIN ROUTES ---
	adminMux := http.NewServeMux()
	// User Management
	adminMux.HandleFunc("GET /v1/admin/users", adminHandlers.ListUsers)
	adminMux.HandleFunc("GET /v1/admin/users/{userID}", adminHandlers.GetUser)
	adminMux.HandleFunc("PATCH /v1/admin/users/{userID}", adminHandlers.UpdateUser)
	adminMux.HandleFunc("DELETE /v1/admin/users/{userID}", adminHandlers.DeleteUser)
	adminMux.HandleFunc("POST /v1/admin/users/{userID}/subscription", adminHandlers.AssignSubscription)

	// Verification Management
	adminMux.HandleFunc("GET /v1/admin/verifications", adminHandlers.ListPendingVerifications)
	adminMux.HandleFunc("GET /v1/admin/verifications/{userID}/document", adminHandlers.GetVerificationDocument)
	adminMux.HandleFunc("POST /v1/admin/verifications/{userID}", adminHandlers.UpdateVerificationStatus)

	// Financial Management
	adminMux.HandleFunc("GET /v1/admin/financials/summary", adminHandlers.GetFinancialSummary)

	// Subscription Plan Management
	adminMux.HandleFunc("GET /v1/admin/plans", adminHandlers.ListSubscriptionPlans)

	// Discount Code Management
	adminMux.HandleFunc("GET /v1/admin/discounts", adminHandlers.ListDiscountCodes)
	adminMux.HandleFunc("POST /v1/admin/discounts", adminHandlers.CreateDiscountCode)
	adminMux.HandleFunc("PATCH /v1/admin/discounts/{codeID}", adminHandlers.UpdateDiscountCode)
	adminMux.HandleFunc("DELETE /v1/admin/discounts/{codeID}", adminHandlers.DeleteDiscountCode)

	// System Health
	adminMux.HandleFunc("GET /v1/admin/health/detailed", adminHandlers.GetSystemHealth)

	// Audit Logs
	adminMux.HandleFunc("GET /v1/admin/audit-logs", adminHandlers.ListAuditLogs)

	// Notifications
	adminMux.HandleFunc("POST /v1/admin/notifications", adminHandlers.SendNotification)

	protectedAdminHandler := app.authMiddleware(app.adminMiddleware(addUploaderToContext(app.Uploader, app.auditLogMiddleware(adminMux))))
	mux.Handle("/v1/admin/", protectedAdminHandler)

	// --- HEALTH CHECK ---
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status":      "ok",
			"description": "Authentication service is up and running",
		})
	})

	return app.corsMiddleware(mux)
}
