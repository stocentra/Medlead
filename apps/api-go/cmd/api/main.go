package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/server"
)

func main() {
	// Load application configuration.
	cfg := config.LoadConfig()

	// Initialize a standard logger.
	logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

	// Create a new connection pool for the database.
	dbpool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("FATAL: Unable to create connection pool: %v\n", err)
	}
	defer dbpool.Close()

	// Ping the database to verify the connection.
	if err := dbpool.Ping(context.Background()); err != nil {
		logger.Fatalf("FATAL: Unable to ping database: %v\n", err)
	}
	logger.Println("Successfully connected to the database.")

	// Create the main application instance with all dependencies.
	app := &server.App{
		Config: cfg,
		Pool:   dbpool,
		Log:    logger,
	}

	// Start the server.
	if err := app.Serve(); err != nil {
		logger.Fatalf("FATAL: could not start server: %v", err)
	}
}
