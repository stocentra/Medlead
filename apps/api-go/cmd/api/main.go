package main

import (
	"log"
	"os"

	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/server"

	supa "github.com/supabase-community/supabase-go"
)

func main() {
	// Load application configuration.
	// The LoadConfig function does not return an error.
	cfg := config.LoadConfig()

	// Initialize a standard logger.
	logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

	// Initialize the Supabase client.
	// The 'err' variable is declared here for the first time using ':='.
	dbClient, err := supa.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceKey, nil)
	if err != nil {
		// 'err' is visible here and we can check if it's not nil.
		logger.Fatalf("FATAL: could not create supabase client: %v", err)
	}
	logger.Println("Successfully connected to Supabase.")

	// Create the main application instance with all dependencies.
	app := &server.App{
		Config: cfg,
		DB:     dbClient,
		Log:    logger,
	}

	// Start the server.
	// Inside the 'if' statement, 'err' is re-declared for the scope of this 'if' block.
	// This is a common and correct pattern in Go.
	if err := app.Serve(); err != nil {
		logger.Fatalf("FATAL: could not start server: %v", err)
	}
}
