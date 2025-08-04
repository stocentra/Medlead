// In: internal/models/context.go
package models

// contextKey is an unexported type for context keys to avoid collisions.
type contextKey string

// UserContextKey is the key for the user object in the request context.
const UserContextKey = contextKey("user")
