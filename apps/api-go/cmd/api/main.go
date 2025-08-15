package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/email"
	"github.com/stocentra/Medlead/api-go/internal/server"
	"github.com/stocentra/Medlead/api-go/internal/storage"
)

func main() {
	// Load .env file from the root of the api-go service
	err := godotenv.Load("apps/api-go/.env")
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Load configuration using the correct function name
	cfg := config.LoadConfig()
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	// Connect to the database using a connection pool (pgxpool)
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Initialize the email client
	emailClient := email.NewEmailClient(cfg.ResendAPIKey, cfg.EmailFrom)

	// Initialize the R2 uploader
	uploader, err := storage.NewR2Uploader(
		cfg.R2Endpoint,
		cfg.R2AccessKeyID,
		cfg.R2SecretAccessKey,
		cfg.R2BucketName,
	)
	if err != nil {
		logger.Fatalf("Failed to initialize R2 uploader: %v", err)
	}

	// Initialize the application with the correct struct fields
	app := &server.App{
		Config:      cfg,
		Pool:        pool,
		Log:         logger,
		EmailClient: emailClient,
		Uploader:    uploader,
	}

	// Start the server
	err = app.Serve()
	if err != nil {
		logger.Fatalf("Failed to start server: %v", err)
	}
}
