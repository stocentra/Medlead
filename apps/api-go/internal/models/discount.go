// In: apps/api-go/internal/models/discount.go
package models

import (
	"time"
)

// DiscountCode represents the structure of the discount_codes table.
type DiscountCode struct {
	ID                 int        `json:"id"`
	Code               string     `json:"code"`
	DiscountPercentage int        `json:"discount_percentage"`
	IsActive           bool       `json:"is_active"`
	PlanID             *int       `json:"plan_id,omitempty"` // MODIFIED: This field was added to link to a specific plan
	ExpirationDate     *time.Time `json:"expiration_date,omitempty"`
	UsageLimit         *int       `json:"usage_limit,omitempty"`
	TimesUsed          int        `json:"times_used"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}
