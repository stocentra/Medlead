package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	SupabaseURL        string
	SupabaseServiceKey string
	ServerPort         string
	DatabaseURL        string // For the pgx connection pooler
}

// LoadConfig loads application configuration from environment variables
func LoadConfig() *Config {
	// For local development, load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		ServerPort:         getEnv("SERVER_PORT", "8000"),
		DatabaseURL:        getEnv("DATABASE_URL", ""), // Load the pooler connection string
	}
}

// Helper function to get an environment variable or return a default value
func getEnv(key string, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	if defaultValue == "" {
		log.Fatalf("FATAL: Environment variable %s is not set.", key)
	}
	return defaultValue
}
