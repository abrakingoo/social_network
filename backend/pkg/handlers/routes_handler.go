package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social/pkg/model"
)

var allowedRoutes = map[string][]string{
	"/api/login": {"POST"},
}

type App struct {
	Queries *sql.DB
	User    *model.User
}

func (app *App) RouteChecker(next http.Handler) http.Handler {
	return http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			allowedURL, ok := allowedRoutes[r.URL.Path]
			if !ok {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusNotFound)
				json.NewEncoder(w).Encode(map[string]string{"message": "route not found"})
				return
			}

			method_found := false
			// Check if the HTTP method is allowed for the route
			for _, method := range allowedURL {
				if r.Method == method {
					method_found = true
				}
			}

			if !method_found {
				app.JSONResponse(w, r, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			next.ServeHTTP(w, r)
		})
}

func (app *App) Routes() http.Handler {
	mux := http.NewServeMux()
	return mux
}
