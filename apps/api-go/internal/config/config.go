package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort   string
	DatabaseURL  string
	JWTSecret    string
	ResendAPIKey string // API Key for Resend
	EmailFrom    string // The "from" email address for sending emails
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		ServerPort:   getEnv("SERVER_PORT", "8000"),
		DatabaseURL:  getEnv("DATABASE_URL", ""),
		JWTSecret:    getEnv("JWT_SECRET", ""),
		ResendAPIKey: getEnv("RESEND_API_KEY", ""), // Load Resend API Key
		EmailFrom:    getEnv("EMAIL_FROM", ""),     // Load the sender email
	}
}

func getEnv(key string, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	if defaultValue == "" {
		log.Fatalf("FATAL: Environment variable %s is not set.", key)
	}
	return defaultValue
}
