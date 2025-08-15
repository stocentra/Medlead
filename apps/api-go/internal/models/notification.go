package models

import (
	"time"

	"github.com/google/uuid"
)

// Notification represents the structure of the notifications table.
type Notification struct {
	ID        int64     `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}
