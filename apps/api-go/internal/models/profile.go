package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Profile represents the structure of the 'profiles' table in the database.
type Profile struct {
	ID                     uuid.UUID       `json:"id"`
	Email                  string          `json:"email"`
	PasswordHash           string          `json:"-"` // Never expose the password hash in JSON responses
	FullName               *string         `json:"full_name,omitempty"`
	NationalID             *string         `json:"national_id,omitempty"`
	Gender                 *string         `json:"gender,omitempty"`
	Country                *string         `json:"country,omitempty"`
	PhoneNumber            *string         `json:"phone_number,omitempty"`
	SystemRole             string          `json:"system_role"`
	ProfessionalLevel      string          `json:"professional_level"`
	University             *string         `json:"university,omitempty"`
	StudentID              *string         `json:"student_id,omitempty"`
	MedicalLicenseNumber   *string         `json:"medical_license_number,omitempty"`
	SpecialtyID            *int64          `json:"specialty_id,omitempty"`
	VerificationStatus     string          `json:"verification_status"`
	CountrySpecificDetails json.RawMessage `json:"country_specific_details,omitempty"`
	CreatedAt              time.Time       `json:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at"`
}
