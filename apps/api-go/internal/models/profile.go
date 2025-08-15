package models

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Profile represents the structure of the profiles table in the database.
type Profile struct {
	ID                              uuid.UUID       `json:"id"`
	Email                           string          `json:"email"`
	PasswordHash                    string          `json:"-"`
	FullName                        string          `json:"full_name"`
	Country                         string          `json:"country"`
	SystemRole                      string          `json:"system_role"`
	ProfessionalLevel               string          `json:"professional_level"`
	VerificationStatus              string          `json:"verification_status"`
	NationalID                      *string         `json:"national_id,omitempty"`
	Gender                          *string         `json:"gender,omitempty"`
	PhoneNumber                     *string         `json:"phone_number,omitempty"`
	University                      *string         `json:"university,omitempty"`
	StudentID                       *string         `json:"student_id,omitempty"`
	MedicalLicenseNumber            *string         `json:"medical_license_number,omitempty"`
	SpecialtyID                     *int64          `json:"specialty_id,omitempty"`
	CountrySpecificDetails          json.RawMessage `json:"country_specific_details,omitempty"`
	EmailVerificationToken          *string         `json:"-"`
	EmailVerificationTokenExpiresAt *time.Time      `json:"-"`
	RefreshToken                    *string         `json:"-"`
	CreatedAt                       time.Time       `json:"created_at"`
	UpdatedAt                       time.Time       `json:"updated_at"`
}

// AdminUserView defines a simplified user profile view for the admin panel user list.
type AdminUserView struct {
	ID                 uuid.UUID `json:"id"`
	FullName           string    `json:"full_name"`
	Email              string    `json:"email"`
	ProfessionalLevel  string    `json:"professional_level"`
	VerificationStatus string    `json:"verification_status"`
	CreatedAt          time.Time `json:"created_at"`
}

// NullableProfile is used for scanning nullable fields from the database.
type NullableProfile struct {
	ID                              uuid.UUID
	Email                           string
	PasswordHash                    string
	FullName                        sql.NullString
	Country                         sql.NullString
	SystemRole                      string
	ProfessionalLevel               sql.NullString
	VerificationStatus              string
	NationalID                      sql.NullString
	Gender                          sql.NullString
	PhoneNumber                     sql.NullString
	University                      sql.NullString
	StudentID                       sql.NullString
	MedicalLicenseNumber            sql.NullString
	SpecialtyID                     sql.NullInt64
	CountrySpecificDetails          []byte
	EmailVerificationToken          sql.NullString
	EmailVerificationTokenExpiresAt sql.NullTime
	RefreshToken                    sql.NullString
	CreatedAt                       time.Time
	UpdatedAt                       time.Time
}

// ToProfile converts a NullableProfile to a standard Profile.
// Corrected: Changed 'models.Profile' to just 'Profile'
func (np *NullableProfile) ToProfile() Profile {
	return Profile{
		ID:                              np.ID,
		Email:                           np.Email,
		PasswordHash:                    np.PasswordHash,
		FullName:                        np.FullName.String,
		Country:                         np.Country.String,
		SystemRole:                      np.SystemRole,
		ProfessionalLevel:               np.ProfessionalLevel.String,
		VerificationStatus:              np.VerificationStatus,
		NationalID:                      ToStringPtr(np.NationalID),
		Gender:                          ToStringPtr(np.Gender),
		PhoneNumber:                     ToStringPtr(np.PhoneNumber),
		University:                      ToStringPtr(np.University),
		StudentID:                       ToStringPtr(np.StudentID),
		MedicalLicenseNumber:            ToStringPtr(np.MedicalLicenseNumber),
		SpecialtyID:                     ToInt64Ptr(np.SpecialtyID),
		CountrySpecificDetails:          np.CountrySpecificDetails,
		EmailVerificationToken:          ToStringPtr(np.EmailVerificationToken),
		EmailVerificationTokenExpiresAt: ToTimePtr(np.EmailVerificationTokenExpiresAt),
		RefreshToken:                    ToStringPtr(np.RefreshToken),
		CreatedAt:                       np.CreatedAt,
		UpdatedAt:                       np.UpdatedAt,
	}
}

// Helper functions to convert sql.Null types to pointers
func ToStringPtr(ns sql.NullString) *string {
	if ns.Valid {
		return &ns.String
	}
	return nil
}

func ToInt64Ptr(ni sql.NullInt64) *int64 {
	if ni.Valid {
		return &ni.Int64
	}
	return nil
}

func ToTimePtr(nt sql.NullTime) *time.Time {
	if nt.Valid {
		return &nt.Time
	}
	return nil
}
