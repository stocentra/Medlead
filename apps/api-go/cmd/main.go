package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

// handler is a simple HTTP handler that writes a welcome message.
func handler(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*") // یا دامنه فرانت خود را جایگزین کنید
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Handle preflight OPTIONS request
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Set the content type to plain text
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")

	// Write the response
	fmt.Fprintln(w, "MedLead Go API is running successfully!")
}

func main() {
	// Create a new ServeMux (HTTP request router)
	mux := http.NewServeMux()

	// Register the handler for the root path "/"
	mux.HandleFunc("/", handler)

	// Get the port from the environment variable.
	// Platforms like Koyeb set this automatically.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // A default port for local testing
	}

	// Start the server and log the port it's listening on.
	log.Printf("Server starting on port %s...", port)

	// Listen for incoming requests.
	// log.Fatal will print the error and exit if the server fails to start.
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("could not start server: %v\n", err)
	}
}
