package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stocentra/Medlead/api-go/internal/config"
)

// App holds application-wide dependencies.
type App struct {
	Config *config.Config
	Pool   *pgxpool.Pool // Connection pool for all database queries
	Log    *log.Logger
}

func (app *App) Serve() error {
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", app.Config.ServerPort),
		Handler: app.routes(),
	}

	app.Log.Printf("Starting server on %s", srv.Addr)
	return srv.ListenAndServe()
}
