// In: apps/api-go/internal/admin/handlers.go
package admin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/models"
	"github.com/stocentra/Medlead/api-go/internal/storage"
)

// Handlers holds dependencies for admin handlers.
type Handlers struct {
	Pool *pgxpool.Pool
	Log  *log.Logger
}

// UserListResponse defines the structure for the user list endpoint.
type UserListResponse struct {
	Users      []models.AdminUserView `json:"users"`
	TotalCount int                    `json:"totalCount"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"pageSize"`
}

// UpdateUserRequest defines the fields an admin can update for a user.
type UpdateUserRequest struct {
	FullName          *string `json:"full_name,omitempty"`
	SystemRole        *string `json:"system_role,omitempty"`
	ProfessionalLevel *string `json:"professional_level,omitempty"`
}

// VerificationRequest defines the structure for a verification update.
type VerificationRequest struct {
	Action string `json:"action"` // "approve" or "reject"
	Reason string `json:"reason,omitempty"`
}

// VerificationUserView defines the user data needed for the verification page.
type VerificationUserView struct {
	models.AdminUserView
	DocumentID  int64  `json:"document_id"`
	StoragePath string `json:"storage_path"`
}

// FinancialSummary defines the structure for the financial overview.
type FinancialSummary struct {
	TotalUsers              int     `json:"totalUsers"`
	TotalSubscribers        int     `json:"totalSubscribers"`
	PendingVerifications    int     `json:"pendingVerifications"`
	MonthlyRecurringRevenue float64 `json:"monthlyRecurringRevenue"`
}

// AssignSubscriptionRequest defines the body for assigning a subscription.
type AssignSubscriptionRequest struct {
	PlanID int    `json:"plan_id"`
	Status string `json:"status"` // e.g., "active"
}

// CreateDiscountCodeRequest defines the body for creating a discount code.
type CreateDiscountCodeRequest struct {
	Code               string     `json:"code"`
	DiscountPercentage int        `json:"discount_percentage"`
	PlanID             *int       `json:"plan_id,omitempty"`
	ExpirationDate     *time.Time `json:"expiration_date,omitempty"`
	UsageLimit         *int       `json:"usage_limit,omitempty"`
}

// UpdateDiscountCodeRequest defines the body for updating a discount code.
type UpdateDiscountCodeRequest struct {
	DiscountPercentage *int       `json:"discount_percentage,omitempty"`
	IsActive           *bool      `json:"is_active,omitempty"`
	PlanID             *int       `json:"plan_id,omitempty"`
	ExpirationDate     *time.Time `json:"expiration_date,omitempty"`
	UsageLimit         *int       `json:"usage_limit,omitempty"`
}

// ServiceStatus defines the health of a single service.
type ServiceStatus struct {
	Name   string `json:"name"`
	Status string `json:"status"` // "ok" or "error"
	Detail string `json:"detail"`
}

// SystemHealthResponse defines the overall system health response.
type SystemHealthResponse struct {
	OverallStatus string          `json:"overallStatus"`
	Services      []ServiceStatus `json:"services"`
}

// SendNotificationRequest defines the body for sending a notification.
type SendNotificationRequest struct {
	Target  string    `json:"target"` // "all", "verified", "specific_user"
	UserID  uuid.UUID `json:"user_id,omitempty"`
	Title   string    `json:"title"`
	Message string    `json:"message"`
}

// ListUsers retrieves a paginated and searchable list of all users.
func (h *Handlers) ListUsers(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if pageSize < 10 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize
	searchQuery := r.URL.Query().Get("search")

	baseQuery := `FROM public.profiles`
	countQuery := `SELECT COUNT(*) ` + baseQuery
	dataQuery := `
		SELECT
			id, full_name, email, professional_level, verification_status, created_at
		` + baseQuery

	if searchQuery != "" {
		condition := " WHERE full_name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%'"
		countQuery += condition
		dataQuery += condition
	}

	var totalCount int
	var err error
	if searchQuery != "" {
		err = h.Pool.QueryRow(context.Background(), countQuery, searchQuery).Scan(&totalCount)
	} else {
		err = h.Pool.QueryRow(context.Background(), countQuery).Scan(&totalCount)
	}

	if err != nil {
		h.Log.Printf("Error counting users: %v", err)
		http.Error(w, "Failed to count users", http.StatusInternalServerError)
		return
	}

	dataQuery += " ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	if searchQuery != "" {
		dataQuery = `
		SELECT
			id, full_name, email, professional_level, verification_status, created_at
		FROM public.profiles
		WHERE full_name ILIKE '%' || $3 || '%' OR email ILIKE '%' || $3 || '%'
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`
	}

	var rows pgx.Rows
	if searchQuery != "" {
		rows, err = h.Pool.Query(context.Background(), dataQuery, pageSize, offset, searchQuery)
	} else {
		rows, err = h.Pool.Query(context.Background(), dataQuery, pageSize, offset)
	}

	if err != nil {
		h.Log.Printf("Error querying users: %v", err)
		http.Error(w, "Failed to retrieve users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []models.AdminUserView{}
	for rows.Next() {
		var user models.AdminUserView
		if err := rows.Scan(&user.ID, &user.FullName, &user.Email, &user.ProfessionalLevel, &user.VerificationStatus, &user.CreatedAt); err != nil {
			h.Log.Printf("Error scanning user row: %v", err)
			continue
		}
		users = append(users, user)
	}

	response := UserListResponse{
		Users:      users,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetUser retrieves a single user's full profile for the admin.
func (h *Handlers) GetUser(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	var profile models.Profile
	query := `
		SELECT
			id, email, full_name, country, system_role, professional_level, verification_status,
			national_id, gender, phone_number, university, student_id,
			medical_license_number, specialty_id, country_specific_details,
			created_at, updated_at
		FROM public.profiles
		WHERE id = $1`
	err = h.Pool.QueryRow(context.Background(), query, userID).Scan(
		&profile.ID, &profile.Email, &profile.FullName, &profile.Country, &profile.SystemRole,
		&profile.ProfessionalLevel, &profile.VerificationStatus, &profile.NationalID, &profile.Gender,
		&profile.PhoneNumber, &profile.University, &profile.StudentID, &profile.MedicalLicenseNumber,
		&profile.SpecialtyID, &profile.CountrySpecificDetails, &profile.CreatedAt, &profile.UpdatedAt,
	)

	if err != nil {
		h.Log.Printf("Admin error fetching profile for user %s: %v", userID, err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

// UpdateUser allows an admin to update a user's details.
func (h *Handlers) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var query bytes.Buffer
	query.WriteString("UPDATE public.profiles SET updated_at = NOW()")
	args := []interface{}{userID}
	argCount := 2

	if req.FullName != nil {
		query.WriteString(fmt.Sprintf(", full_name = $%d", argCount))
		args = append(args, *req.FullName)
		argCount++
	}
	if req.SystemRole != nil {
		query.WriteString(fmt.Sprintf(", system_role = $%d", argCount))
		args = append(args, *req.SystemRole)
		argCount++
	}
	if req.ProfessionalLevel != nil {
		query.WriteString(fmt.Sprintf(", professional_level = $%d", argCount))
		args = append(args, *req.ProfessionalLevel)
		argCount++
	}

	if argCount == 2 {
		http.Error(w, "No update fields provided", http.StatusBadRequest)
		return
	}

	query.WriteString(" WHERE id = $1")
	_, err = h.Pool.Exec(context.Background(), query.String(), args...)
	if err != nil {
		h.Log.Printf("Admin error updating profile for user %s: %v", userID, err)
		http.Error(w, "Failed to update user profile", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteUser allows an admin to delete a user.
func (h *Handlers) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	query := "DELETE FROM public.profiles WHERE id = $1"
	_, err = h.Pool.Exec(context.Background(), query, userID)
	if err != nil {
		h.Log.Printf("Admin error deleting user %s: %v", userID, err)
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListPendingVerifications retrieves all users with a 'pending' verification status.
func (h *Handlers) ListPendingVerifications(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT
			p.id, p.full_name, p.email, p.professional_level, p.verification_status, p.created_at,
			uvd.id as document_id, uvd.storage_path
		FROM public.profiles p
		JOIN public.user_verification_documents uvd ON p.id = uvd.user_id
		WHERE p.verification_status = 'pending'
		ORDER BY p.updated_at ASC`

	rows, err := h.Pool.Query(context.Background(), query)
	if err != nil {
		h.Log.Printf("Error querying pending verifications: %v", err)
		http.Error(w, "Failed to retrieve pending verifications", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []VerificationUserView{}
	for rows.Next() {
		var user VerificationUserView
		if err := rows.Scan(
			&user.ID, &user.FullName, &user.Email, &user.ProfessionalLevel, &user.VerificationStatus, &user.CreatedAt,
			&user.DocumentID, &user.StoragePath,
		); err != nil {
			h.Log.Printf("Error scanning verification row: %v", err)
			continue
		}
		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(users)
}

// GetVerificationDocument generates a presigned URL for a user's document.
func (h *Handlers) GetVerificationDocument(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	var storagePath string
	query := `SELECT storage_path FROM public.user_verification_documents WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1`
	err = h.Pool.QueryRow(context.Background(), query, userID).Scan(&storagePath)
	if err != nil {
		h.Log.Printf("Error finding document for user %s: %v", userID, err)
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	uploader := r.Context().Value("uploader").(*storage.R2Uploader)
	url, err := uploader.GetPresignedURL(r.Context(), storagePath)
	if err != nil {
		h.Log.Printf("Error generating presigned URL for user %s: %v", userID, err)
		http.Error(w, "Failed to generate document URL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"url": url})
}

// UpdateVerificationStatus approves or rejects a user's verification.
func (h *Handlers) UpdateVerificationStatus(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	var req VerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var newStatus string
	switch req.Action {
	case "approve":
		newStatus = "verified"
	case "reject":
		newStatus = "rejected"
	default:
		http.Error(w, "Invalid action. Must be 'approve' or 'reject'.", http.StatusBadRequest)
		return
	}

	query := `UPDATE public.profiles SET verification_status = $1, updated_at = NOW() WHERE id = $2`
	_, err = h.Pool.Exec(context.Background(), query, newStatus, userID)
	if err != nil {
		h.Log.Printf("Error updating verification status for user %s: %v", userID, err)
		http.Error(w, "Failed to update user status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetFinancialSummary calculates and returns key business metrics.
func (h *Handlers) GetFinancialSummary(w http.ResponseWriter, r *http.Request) {
	var summary FinancialSummary
	ctx := context.Background()

	err := h.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM public.profiles").Scan(&summary.TotalUsers)
	if err != nil {
		h.Log.Printf("Error getting total users count: %v", err)
		http.Error(w, "Failed to get total users", http.StatusInternalServerError)
		return
	}

	err = h.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM public.profiles WHERE verification_status = 'pending'").Scan(&summary.PendingVerifications)
	if err != nil {
		h.Log.Printf("Error getting pending verifications count: %v", err)
		http.Error(w, "Failed to get pending verifications", http.StatusInternalServerError)
		return
	}

	query := `
        SELECT p.price_monthly, COUNT(s.id)
        FROM public.subscriptions s
        JOIN public.plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        GROUP BY p.price_monthly
    `
	rows, err := h.Pool.Query(ctx, query)
	if err != nil {
		h.Log.Printf("Error getting subscriber counts: %v", err)
		http.Error(w, "Failed to get subscriber counts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var totalMRR int
	for rows.Next() {
		var price, count int
		if err := rows.Scan(&price, &count); err != nil {
			h.Log.Printf("Error scanning subscriber row: %v", err)
			continue
		}
		summary.TotalSubscribers += count
		totalMRR += price * count
	}
	summary.MonthlyRecurringRevenue = float64(totalMRR) / 100.0

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(summary)
}

// AssignSubscription allows an admin to create or update a user's subscription.
func (h *Handlers) AssignSubscription(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.PathValue("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	var req AssignSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO public.subscriptions (user_id, plan_id, status, start_date, end_date)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id) DO UPDATE
		SET plan_id = EXCLUDED.plan_id,
			status = EXCLUDED.status,
			start_date = EXCLUDED.start_date,
			end_date = EXCLUDED.end_date,
			updated_at = NOW();
	`
	startDate := time.Now()
	var endDate *time.Time
	if req.Status == "active" {
		t := startDate.AddDate(0, 1, 0)
		endDate = &t
	}

	_, err = h.Pool.Exec(context.Background(), query, userID, req.PlanID, req.Status, startDate, endDate)
	if err != nil {
		h.Log.Printf("Error assigning subscription for user %s: %v", userID, err)
		http.Error(w, "Failed to assign subscription", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Subscription updated successfully"})
}

// ListDiscountCodes retrieves all discount codes.
func (h *Handlers) ListDiscountCodes(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, code, discount_percentage, is_active, plan_id, expiration_date, usage_limit, times_used, created_at, updated_at FROM public.discount_codes ORDER BY created_at DESC"
	rows, err := h.Pool.Query(context.Background(), query)
	if err != nil {
		h.Log.Printf("Error querying discount codes: %v", err)
		http.Error(w, "Failed to retrieve discount codes", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	codes := []models.DiscountCode{}
	for rows.Next() {
		var code models.DiscountCode
		if err := rows.Scan(&code.ID, &code.Code, &code.DiscountPercentage, &code.IsActive, &code.PlanID, &code.ExpirationDate, &code.UsageLimit, &code.TimesUsed, &code.CreatedAt, &code.UpdatedAt); err != nil {
			h.Log.Printf("Error scanning discount code row: %v", err)
			continue
		}
		codes = append(codes, code)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(codes)
}

// CreateDiscountCode creates a new discount code.
func (h *Handlers) CreateDiscountCode(w http.ResponseWriter, r *http.Request) {
	var req CreateDiscountCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Code == "" || req.DiscountPercentage <= 0 || req.DiscountPercentage > 100 {
		http.Error(w, "Invalid data for discount code", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO public.discount_codes (code, discount_percentage, plan_id, expiration_date, usage_limit)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, code, discount_percentage, is_active, plan_id, expiration_date, usage_limit, times_used, created_at, updated_at
	`
	var newCode models.DiscountCode
	err := h.Pool.QueryRow(context.Background(), query, req.Code, req.DiscountPercentage, req.PlanID, req.ExpirationDate, req.UsageLimit).Scan(
		&newCode.ID, &newCode.Code, &newCode.DiscountPercentage, &newCode.IsActive, &newCode.PlanID, &newCode.ExpirationDate, &newCode.UsageLimit, &newCode.TimesUsed, &newCode.CreatedAt, &newCode.UpdatedAt,
	)

	if err != nil {
		h.Log.Printf("Error creating discount code: %v", err)
		http.Error(w, "Failed to create discount code", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newCode)
}

// UpdateDiscountCode updates an existing discount code.
func (h *Handlers) UpdateDiscountCode(w http.ResponseWriter, r *http.Request) {
	codeIDStr := r.PathValue("codeID")
	codeID, err := strconv.Atoi(codeIDStr)
	if err != nil {
		http.Error(w, "Invalid discount code ID", http.StatusBadRequest)
		return
	}

	var req UpdateDiscountCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var query bytes.Buffer
	query.WriteString("UPDATE public.discount_codes SET updated_at = NOW()")
	args := []interface{}{codeID}
	argCount := 2

	if req.DiscountPercentage != nil {
		query.WriteString(fmt.Sprintf(", discount_percentage = $%d", argCount))
		args = append(args, *req.DiscountPercentage)
		argCount++
	}
	if req.IsActive != nil {
		query.WriteString(fmt.Sprintf(", is_active = $%d", argCount))
		args = append(args, *req.IsActive)
		argCount++
	}
	if req.PlanID != nil {
		// Use a sentinel value like 0 from the frontend to signify setting the plan to NULL
		if *req.PlanID == 0 {
			query.WriteString(", plan_id = NULL") // CORRECTED: No Sprintf here
		} else {
			query.WriteString(fmt.Sprintf(", plan_id = $%d", argCount))
			args = append(args, *req.PlanID)
			argCount++
		}
	}
	if req.ExpirationDate != nil {
		query.WriteString(fmt.Sprintf(", expiration_date = $%d", argCount))
		args = append(args, *req.ExpirationDate)
		argCount++
	}
	if req.UsageLimit != nil {
		query.WriteString(fmt.Sprintf(", usage_limit = $%d", argCount))
		args = append(args, *req.UsageLimit)
		argCount++
	}

	if argCount == 2 {
		http.Error(w, "No update fields provided", http.StatusBadRequest)
		return
	}

	query.WriteString(" WHERE id = $1")
	_, err = h.Pool.Exec(context.Background(), query.String(), args...)
	if err != nil {
		h.Log.Printf("Error updating discount code %d: %v", codeID, err)
		http.Error(w, "Failed to update discount code", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteDiscountCode deletes a discount code.
func (h *Handlers) DeleteDiscountCode(w http.ResponseWriter, r *http.Request) {
	codeIDStr := r.PathValue("codeID")
	codeID, err := strconv.Atoi(codeIDStr)
	if err != nil {
		http.Error(w, "Invalid discount code ID", http.StatusBadRequest)
		return
	}

	query := "DELETE FROM public.discount_codes WHERE id = $1"
	_, err = h.Pool.Exec(context.Background(), query, codeID)
	if err != nil {
		h.Log.Printf("Error deleting discount code %d: %v", codeID, err)
		http.Error(w, "Failed to delete discount code", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetSystemHealth checks the status of the database and other dependent services.
func (h *Handlers) GetSystemHealth(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	response := SystemHealthResponse{
		OverallStatus: "ok",
		Services:      []ServiceStatus{},
	}

	dbStatus := ServiceStatus{Name: "PostgreSQL Database", Status: "ok", Detail: "Connection successful."}
	if err := h.Pool.Ping(ctx); err != nil {
		dbStatus.Status = "error"
		dbStatus.Detail = "Failed to ping database: " + err.Error()
		response.OverallStatus = "error"
	}
	response.Services = append(response.Services, dbStatus)

	modelServiceURL := os.Getenv("MODEL_API_HEALTH_URL")
	aiServiceStatus := ServiceStatus{Name: "AI Model Service", Status: "ok", Detail: "Service is responsive."}
	if modelServiceURL != "" {
		resp, err := http.Get(modelServiceURL)
		if err != nil || resp.StatusCode != http.StatusOK {
			aiServiceStatus.Status = "error"
			if err != nil {
				aiServiceStatus.Detail = fmt.Sprintf("Failed to reach service: %v", err) // Sprintf is valid here
			} else {
				aiServiceStatus.Detail = fmt.Sprintf("Service returned status: %d", resp.StatusCode) // Sprintf is valid here
			}
			response.OverallStatus = "error"
		} else {
			resp.Body.Close()
		}
	} else {
		aiServiceStatus.Status = "unknown"
		aiServiceStatus.Detail = "MODEL_API_HEALTH_URL environment variable not set."
	}
	response.Services = append(response.Services, aiServiceStatus)

	w.Header().Set("Content-Type", "application/json")
	if response.OverallStatus == "error" {
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		w.WriteHeader(http.StatusOK)
	}
	json.NewEncoder(w).Encode(response)
}

// ListAuditLogs retrieves a paginated list of all audit log entries.
func (h *Handlers) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if pageSize < 20 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	query := `
		SELECT id, admin_id, action, target_id, details, ip_address, created_at
		FROM public.audit_logs
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := h.Pool.Query(context.Background(), query, pageSize, offset)
	if err != nil {
		h.Log.Printf("Error querying audit logs: %v", err)
		http.Error(w, "Failed to retrieve audit logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	logs := []models.AuditLog{}
	for rows.Next() {
		var logEntry models.AuditLog
		if err := rows.Scan(
			&logEntry.ID, &logEntry.AdminID, &logEntry.Action, &logEntry.TargetID,
			&logEntry.Details, &logEntry.IPAddress, &logEntry.CreatedAt,
		); err != nil {
			h.Log.Printf("Error scanning audit log row: %v", err)
			continue
		}
		logs = append(logs, logEntry)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(logs)
}

// SendNotification sends a notification to targeted users.
func (h *Handlers) SendNotification(w http.ResponseWriter, r *http.Request) {
	var req SendNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Message == "" {
		http.Error(w, "Title and message are required", http.StatusBadRequest)
		return
	}

	var targetUserIDs []uuid.UUID
	ctx := context.Background()

	switch req.Target {
	case "all":
		rows, err := h.Pool.Query(ctx, "SELECT id FROM public.profiles")
		if err != nil {
			h.Log.Printf("Error fetching all user IDs for notification: %v", err)
			http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err == nil {
				targetUserIDs = append(targetUserIDs, id)
			}
		}
	case "verified":
		rows, err := h.Pool.Query(ctx, "SELECT id FROM public.profiles WHERE verification_status = 'verified'")
		if err != nil {
			h.Log.Printf("Error fetching verified user IDs for notification: %v", err)
			http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err == nil {
				targetUserIDs = append(targetUserIDs, id)
			}
		}
	case "specific_user":
		if req.UserID == uuid.Nil {
			http.Error(w, "User ID is required for specific_user target", http.StatusBadRequest)
			return
		}
		targetUserIDs = append(targetUserIDs, req.UserID)
	default:
		http.Error(w, "Invalid target specified", http.StatusBadRequest)
		return
	}

	if len(targetUserIDs) == 0 {
		http.Error(w, "No target users found", http.StatusNotFound)
		return
	}

	tx, err := h.Pool.Begin(ctx)
	if err != nil {
		h.Log.Printf("Error starting transaction for sending notification: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	stmt, err := tx.Prepare(ctx, "insert_notification", "INSERT INTO public.notifications (user_id, title, message) VALUES ($1, $2, $3)")
	if err != nil {
		h.Log.Printf("Error preparing statement for sending notification: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	for _, userID := range targetUserIDs {
		if _, err := tx.Exec(ctx, stmt.Name, userID, req.Title, req.Message); err != nil {
			h.Log.Printf("Error inserting notification for user %s: %v", userID, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		h.Log.Printf("Error committing transaction for sending notification: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":         "Notification sent successfully",
		"recipient_count": len(targetUserIDs),
	})
}

// ListSubscriptionPlans retrieves all active subscription plans.
func (h *Handlers) ListSubscriptionPlans(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, name, price_monthly, is_active, created_at
		FROM public.plans
		WHERE is_active = true
		ORDER BY price_monthly ASC
	`
	rows, err := h.Pool.Query(context.Background(), query)
	if err != nil {
		h.Log.Printf("Error querying subscription plans: %v", err)
		http.Error(w, "Failed to retrieve subscription plans", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	plans := []models.Plan{}
	for rows.Next() {
		var plan models.Plan
		if err := rows.Scan(
			&plan.ID, &plan.Name, &plan.PriceMonthly, &plan.IsActive, &plan.CreatedAt,
		); err != nil {
			h.Log.Printf("Error scanning plan row: %v", err)
			continue
		}
		plans = append(plans, plan)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(plans)
}
