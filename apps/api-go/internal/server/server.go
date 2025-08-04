package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/stocentra/Medlead/api-go/internal/config"

	supa "github.com/supabase-community/supabase-go"
)

// App holds application-wide dependencies
type App struct {
	Config *config.Config
	DB     *supa.Client
	Log    *log.Logger
}

func (app *App) Serve() error {
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", app.Config.ServerPort),
		Handler: app.routes(), // We will create this method next
	}

	app.Log.Printf("Starting server on %s", srv.Addr)
	return srv.ListenAndServe()
}
