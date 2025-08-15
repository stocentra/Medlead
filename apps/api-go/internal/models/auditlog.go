package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AuditLog represents the structure of the audit_logs table.
type AuditLog struct {
	ID        int64           `json:"id"`
	AdminID   uuid.UUID       `json:"admin_id"`
	Action    string          `json:"action"`
	TargetID  *string         `json:"target_id,omitempty"`
	Details   json.RawMessage `json:"details,omitempty"`
	IPAddress string          `json:"ip_address"`
	CreatedAt time.Time       `json:"created_at"`
}
