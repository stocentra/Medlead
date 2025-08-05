package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/email" // Import email package
	"github.com/stocentra/Medlead/api-go/internal/server"
)

func main() {
	cfg := config.LoadConfig()
	logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

	dbpool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("FATAL: Unable to create connection pool: %v\n", err)
	}
	defer dbpool.Close()

	if err := dbpool.Ping(context.Background()); err != nil {
		logger.Fatalf("FATAL: Unable to ping database: %v\n", err)
	}
	logger.Println("Successfully connected to the database.")

	// Initialize the email client
	emailClient := email.NewEmailClient(cfg.ResendAPIKey, cfg.EmailFrom)

	app := &server.App{
		Config:      cfg,
		Pool:        dbpool,
		Log:         logger,
		EmailClient: emailClient, // Pass the email client to the app
	}

	if err := app.Serve(); err != nil {
		logger.Fatalf("FATAL: could not start server: %v", err)
	}
}
