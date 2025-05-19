package handler

import (
	"net/http"

	"social/pkg/model"
	"social/pkg/repository"
)

var allowedRoutes = map[string][]string{
	"/api/login":    {"POST", "OPTIONS"},
	"/api/register": {"POST", "OPTIONS"},
	"/api/addPost":  {"POST", "OPTIONS"},
	"/api/getPosts": {"GET", "OPTIONS"},
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
				app.JSONResponse(w, r, http.StatusNotFound, "route not found", Error)
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
				app.JSONResponse(w, r, http.StatusMethodNotAllowed, "method not allowed", Error)
				return
			}
			next.ServeHTTP(w, r)
		})
}

func (app *App) Routes() http.Handler {
	mux := http.NewServeMux()

	// Public routes with CORS
	mux.Handle("/api/register", app.WithCORS(http.HandlerFunc(app.Register)))
	mux.Handle("/api/login", app.WithCORS(http.HandlerFunc(app.Login)))

	// protected routes
	mux.Handle("/api/addPost", app.WithCORS(http.HandlerFunc(app.AddPost)))
	mux.Handle("/api/getPosts", app.WithCORS(http.HandlerFunc(app.GetPosts)))
	return mux
}
