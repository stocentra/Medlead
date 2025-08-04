// In: cmd/api/main.go
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
	cfg := config.LoadConfig()

	// Initialize a standard logger.
	logger := log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)

	// --- THE FIX IS HERE ---
	// Create client options and explicitly set the schema to "public".
	clientOptions := supa.ClientOptions{
		Schema: "public",
	}

	// Initialize the Supabase client with the correct options.
	dbClient, err := supa.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceKey, &clientOptions)
	if err != nil {
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
	if err := app.Serve(); err != nil {
		logger.Fatalf("FATAL: could not start server: %v", err)
	}
}
