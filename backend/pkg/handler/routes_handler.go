package handler

import (
	"net/http"

	"social/pkg/model"
	"social/pkg/repository"
)

var allowedRoutes = map[string][]string{
	"/api/auth/login":    {"POST", "OPTIONS"},
	// "/api/auth/logout":   {"POST", "OPTIONS"},
	"/api/auth/check":    {"GET", "OPTIONS"},
	"/api/auth/register": {"POST", "OPTIONS"},
	"/api/users":         {"GET", "OPTIONS"},
	"/api/users/":        {"GET", "OPTIONS"},
	"/api/addPost":       {"POST", "OPTIONS"},
	"/api/getPosts":      {"GET", "OPTIONS"},
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
	mux.Handle("/api/auth/register", app.WithCORS(http.HandlerFunc(app.Register)))
	mux.Handle("/api/auth/login", app.WithCORS(http.HandlerFunc(app.Login)))
	// mux.Handle("/api/auth/logout", app.WithCORS(http.HandlerFunc(app.Logout)))
	mux.Handle("/api/auth/check", app.WithCORS(http.HandlerFunc(app.CheckAuth)))

	// Protected routes
	mux.Handle("/api/users", app.WithCORS(app.AuthMiddleware(http.HandlerFunc(app.GetAllUsers))))
	mux.Handle("/api/users/", app.WithCORS(app.AuthMiddleware(http.HandlerFunc(app.GetUserById))))
	mux.Handle("/api/addPost", app.WithCORS(app.AuthMiddleware(http.HandlerFunc(app.AddPost))))
	mux.Handle("/api/getPosts", app.WithCORS(app.AuthMiddleware(http.HandlerFunc(app.GetPosts))))
	return mux
}
