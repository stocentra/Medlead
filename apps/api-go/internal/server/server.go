package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool" // Import pgxpool
	"github.com/stocentra/Medlead/api-go/internal/config"
	supa "github.com/supabase-community/supabase-go"
)

// App holds application-wide dependencies
type App struct {
	Config *config.Config
	DB     *supa.Client  // Supabase client for Auth
	Pool   *pgxpool.Pool // Connection pool for direct DB queries
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
