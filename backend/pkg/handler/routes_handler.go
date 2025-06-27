package handler

import (
	"net/http"
	"strings"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/websocket"
)

var allowedRoutes = map[string][]string{
	"/api/login":         {"POST", "OPTIONS"},
	"/api/register":      {"POST", "OPTIONS"},
	"/api/addPost":       {"POST", "OPTIONS"},
	"/api/getPosts":      {"GET", "OPTIONS"},
	"/api/profile":       {"GET", "OPTIONS"},
	"/api/logout":        {"POST", "OPTIONS"},
	"/api/addGroup":      {"POST", "OPTIONS"},
	"/api/getGroupData":  {"GET", "POST", "OPTIONS"},
	"/pkg/db/media/":     {"GET", "OPTIONS"},
	"/api/addEvent":      {"POST", "OPTIONS"},
	"/api/updateUser":    {"PATCH", "OPTIONS"},
	"/api/groups":        {"GET", "OPTIONS"},
	"/api/deleteGroup":   {"DELETE", "OPTIONS"},
	"/api/ws":            {"GET", "OPTIONS"},
	"/api/rsvp":          {"POST", "OPTIONS"},
	"/api/users":         {"GET", "OPTIONS"},
	"/api/addComment":    {"POST", "OPTIONS"},
	"/api/likeComment":   {"POST", "OPTIONS"},
	"/api/likePost":      {"POST", "OPTIONS"},
	"/api/notifications": {"GET", "OPTIONS"},
	"/api/getProfile":    {"GET", "OPTIONS", "POST"},
}

type App struct {
	Queries repository.Query
	User    *model.User
	Hub     *websocket.Hub
}

// RouteChecker is a middleware that checks if the requested route and method are allowed.
func (app *App) RouteChecker(next http.Handler) http.Handler {
	return http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			allowedURL, ok := allowedRoutes[r.URL.Path]
			if !ok && !strings.HasPrefix(r.URL.Path, "/pkg/db/media/") {
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

			if strings.HasPrefix(r.URL.Path, "/pkg/db/media/") && r.Method == http.MethodGet {
				method_found = true
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
	fs := http.FileServer(http.Dir("pkg/db/media"))
	mux.Handle("/pkg/db/media/", http.StripPrefix("/pkg/db/media/", fs))

	// protected routes
	mux.Handle("/api/addPost", app.AuthMiddleware(http.HandlerFunc(app.AddPost)))
	mux.Handle("/api/getPosts", app.AuthMiddleware(http.HandlerFunc(app.GetPosts)))
	mux.Handle("/api/profile", app.AuthMiddleware(http.HandlerFunc(app.Profile)))
	mux.Handle("/api/logout", app.AuthMiddleware(http.HandlerFunc(app.Logout)))
	mux.Handle("/api/addGroup", app.AuthMiddleware(http.HandlerFunc(app.AddGroup)))
	mux.Handle("/api/getGroupData", app.AuthMiddleware(http.HandlerFunc(app.GetGroupData)))
	mux.Handle("/api/addEvent", app.AuthMiddleware(http.HandlerFunc(app.AddEvent)))
	mux.Handle("/api/updateUser", app.AuthMiddleware(http.HandlerFunc(app.UpdateUser)))
	mux.Handle("/api/groups", app.AuthMiddleware(http.HandlerFunc(app.GetAllGroups)))
	mux.Handle("/api/deleteGroup", app.AuthMiddleware(http.HandlerFunc(app.DeleteGroup)))
	mux.Handle("/api/ws", app.AuthMiddleware(http.HandlerFunc(app.HandleWebsocket)))
	mux.Handle("/api/rsvp", app.AuthMiddleware(http.HandlerFunc(app.Rsvp)))
	mux.Handle("/api/users", app.AuthMiddleware(http.HandlerFunc(app.GetAllUsers)))
	mux.Handle("/api/addComment", app.AuthMiddleware(http.HandlerFunc(app.AddComment)))
	mux.Handle("/api/likeComment", app.AuthMiddleware(http.HandlerFunc(app.LikeComment)))
	mux.Handle("/api/likePost", app.AuthMiddleware(http.HandlerFunc(app.LikePost)))
	mux.Handle("/api/notifications", app.AuthMiddleware(http.HandlerFunc(app.Notifications)))

	return mux
}
