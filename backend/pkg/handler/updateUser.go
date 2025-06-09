package handler

import (
	"encoding/json"
	"net/http"
)

var allowedUserFields = map[string]bool{
	"first_name":    true,
	"last_name":     true,
	"email":         true,
	"date_of_birth": true,
	"nickname":      true,
	"about_me":      true,
	"is_public":     true,
}

func (app *App) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	var updateData map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Invalid JSON body", Error)
		return
	}

	var columns []string
	var values []any

	for key, val := range updateData {
		if allowedUserFields[key] {
			columns = append(columns, key)
			values = append(values, val)
		}
	}

	if len(columns) == 0 {
		app.JSONResponse(w, r, http.StatusBadRequest, "No valid fields to update", Error)
		return
	}

	err = app.Queries.UpdateUser(userID, "users", columns, values)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to update user", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "User updated successfully", Success)
}
