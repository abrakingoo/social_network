package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
	"social/pkg/repository"
)

var allowedRoutes = map[string][]string{
	"/api/login":    {"POST"},
	"/api/register": {"POST"},
}

type App struct {
	Queries repository.Query
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

	mux.HandleFunc("/api/register", app.Register)
	mux.HandleFunc("/api/login", app.Login)
	return mux
}
