package email

import (
	"fmt"

	"github.com/resend/resend-go/v2"
)

// EmailClient holds the Resend client and configuration.
type EmailClient struct {
	client *resend.Client
	from   string
}

// NewEmailClient creates a new client for sending emails.
func NewEmailClient(apiKey, fromEmail string) *EmailClient {
	client := resend.NewClient(apiKey)
	return &EmailClient{
		client: client,
		from:   fromEmail,
	}
}

// SendVerificationEmail sends an email to a user with a verification link.
func (c *EmailClient) SendVerificationEmail(to, token string) error {
	subject := "Welcome to MedLead! Please Verify Your Email"

	// IMPORTANT: In production, this URL should be your frontend URL.
	verificationURL := fmt.Sprintf("https://api.medlead.ir/v1/auth/verify-email?token=%s", token)

	htmlBody := fmt.Sprintf(`
		<h1>Welcome to MedLead!</h1>
		<p>Thank you for registering. Please click the link below to verify your email address:</p>
		<a href="%s">Verify My Email</a>
		<p>If you did not register for MedLead, please ignore this email.</p>
	`, verificationURL)

	params := &resend.SendEmailRequest{
		From:    c.from,
		To:      []string{to},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := c.client.Emails.Send(params)
	if err != nil {
		return err
	}

	return nil
}
