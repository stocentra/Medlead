// In: internal/server/server.go
package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/config"
	"github.com/stocentra/Medlead/api-go/internal/email"
	"github.com/stocentra/Medlead/api-go/internal/storage" // Import storage package
)

// App holds application-wide dependencies.
type App struct {
	Config      *config.Config
	Pool        *pgxpool.Pool
	Log         *log.Logger
	EmailClient *email.EmailClient
	Uploader    *storage.R2Uploader // R2 uploader client
}

// Serve configures and starts the HTTP server.
func (app *App) Serve() error {
	handler := app.corsMiddleware(app.routes())

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", app.Config.ServerPort),
		Handler: handler,
	}

	app.Log.Printf("Starting server on %s", srv.Addr)
	return srv.ListenAndServe()
}
