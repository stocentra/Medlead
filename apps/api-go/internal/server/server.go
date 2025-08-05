package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/email" // Import email package
)

// App holds application-wide dependencies.
type App struct {
	Config      *config.Config
	Pool        *pgxpool.Pool
	Log         *log.Logger
	EmailClient *email.EmailClient // Client for sending emails via Resend
}

// Serve configures and starts the HTTP server.
func (app *App) Serve() error {
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", app.Config.ServerPort),
		Handler: app.routes(), // Initialize routes
	}

	app.Log.Printf("Starting server on %s", srv.Addr)
	return srv.ListenAndServe()
}
