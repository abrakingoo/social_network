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
	"/api/profile":  {"GET", "OPTIONS"},
	"/api/logout":   {"POST", "OPTIONS"},
	"/api/addGroup": {"POST", "OPTIONS"},
}

type App struct {
	Queries repository.Query
	User    *model.User
}

// RouteChecker is a middleware that checks if the requested route and method are allowed.
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

// Routes sets up the application routes and returns an http.Handler.
func (app *App) Routes() http.Handler {
	mux := http.NewServeMux()

	// Public routes
	mux.Handle("/api/register", http.HandlerFunc(app.Register))
	mux.Handle("/api/login", http.HandlerFunc(app.Login))

	// Serve media files
	fs := http.FileServer(http.Dir("backend/pkg/db/media"))
	mux.Handle("/pkg/db/media/", http.StripPrefix("/pkg/db/media/", fs))

	// protected routes
	mux.Handle("/api/addPost", app.AuthMiddleware(http.HandlerFunc(app.AddPost)))
	mux.Handle("/api/getPosts", app.AuthMiddleware(http.HandlerFunc(app.GetPosts)))
	mux.Handle("/api/profile", app.AuthMiddleware(http.HandlerFunc(app.Profile)))
	mux.Handle("/api/logout", app.AuthMiddleware(http.HandlerFunc(app.Logout)))
	mux.Handle("/api/addGroup", app.AuthMiddleware(http.HandlerFunc(app.AddGroup)))
	return mux
}
