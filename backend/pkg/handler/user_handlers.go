package handler

import (
	"net/http"
	"strings"
)

// GetAllUsers returns a list of all users
func (app *App) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := app.Queries.GetAllUsers()
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to fetch users", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, map[string]interface{}{
		"users": users,
	}, Success)
}

// GetUserById returns a specific user by ID
func (app *App) GetUserById(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		app.JSONResponse(w, r, http.StatusBadRequest, "Invalid user ID", Error)
		return
	}
	userID := pathParts[3]

	// Get user data
	userData, err := app.Queries.GetUserData(userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusNotFound, "User not found", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, map[string]interface{}{
		"user": userData,
	}, Success)
}