package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application.
type Config struct {
	ServerPort  string
	DatabaseURL string // For the pgx connection pooler
	JWTSecret   string // Secret key for signing JWT tokens
}

// LoadConfig loads application configuration from environment variables.
func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		ServerPort:  getEnv("SERVER_PORT", "8000"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		JWTSecret:   getEnv("JWT_SECRET", ""), // JWT_SECRET is critical for security
	}
}

// getEnv helper function to get an environment variable or return a default value.
func getEnv(key string, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	if defaultValue == "" {
		// For critical variables, we should fail fast if they are not set.
		log.Fatalf("FATAL: Environment variable %s is not set.", key)
	}
	return defaultValue
}
