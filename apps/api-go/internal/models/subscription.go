package models

import (
	"time"

	"github.com/google/uuid"
)

// Plan represents a subscription plan.
type Plan struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	PriceMonthly   int       `json:"price_monthly"`
	CreditsMonthly int       `json:"credits_monthly"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
}

// Subscription represents a user's subscription to a plan.
type Subscription struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	PlanID    int        `json:"plan_id"`
	Status    string     `json:"status"`
	StartDate time.Time  `json:"start_date"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
