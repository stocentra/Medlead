package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/server"

	supa "github.com/supabase-community/supabase-go"
)

func main() {
	// Load application configuration.
	cfg := config.LoadConfig()

	// Initialize a standard logger.
	logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

	// --- Supabase Client for AUTHENTICATION ONLY ---
	dbClient, err := supa.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceKey, nil)
	if err != nil {
		logger.Fatalf("FATAL: could not create supabase client: %v", err)
	}
	logger.Println("Successfully initialized Supabase Auth client.")

	// --- PGX Connection Pool for DATABASE QUERIES ---
	// Use the DATABASE_URL environment variable for the pooler.
	dbpool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("FATAL: Unable to create connection pool: %v\n", err)
	}
	defer dbpool.Close()
	logger.Println("Successfully connected to the database pooler.")

	// Create the main application instance with all dependencies.
	app := &server.App{
		Config: cfg,
		DB:     dbClient,
		Pool:   dbpool, // Pass the connection pool
		Log:    logger,
	}

	// Start the server.
	if err := app.Serve(); err != nil {
		logger.Fatalf("FATAL: could not start server: %v", err)
	}
}
