package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Profile struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"` // Made non-nullable
	Country      string    `json:"country"`   // Made non-nullable

	// These fields are core to the application's logic and must not be null.
	SystemRole         string `json:"system_role"`
	ProfessionalLevel  string `json:"professional_level"`
	VerificationStatus string `json:"verification_status"`

	// These fields can be nullable as they might be provided later.
	NationalID             *string         `json:"national_id,omitempty"`
	Gender                 *string         `json:"gender,omitempty"`
	PhoneNumber            *string         `json:"phone_number,omitempty"`
	University             *string         `json:"university,omitempty"`
	StudentID              *string         `json:"student_id,omitempty"`
	MedicalLicenseNumber   *string         `json:"medical_license_number,omitempty"`
	SpecialtyID            *int64          `json:"specialty_id,omitempty"`
	CountrySpecificDetails json.RawMessage `json:"country_specific_details,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
