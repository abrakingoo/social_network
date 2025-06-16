package handler

import (
	"encoding/json"
	"net/http"
)

type GroupTitle struct {
	Title string `json:"title"`
}

// GetGroupData handles the request to fetch group data based on the group title.
// It decodes the JSON request body to get the group title, fetches the group ID,
func (app *App) GetGroupData(w http.ResponseWriter, r *http.Request) {
	var groupTitle GroupTitle

	err := json.NewDecoder(r.Body).Decode(&groupTitle)
	if err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Invalid JSON data", Error)
		return
	}

	// Get user ID from session
	userID, err := app.GetSessionData(r)
	if err != nil {
		// If user is not logged in, we'll still fetch the group data but without user-specific info
		userID = ""
	}

	id, err := app.Queries.FetchGroupId(groupTitle.Title)
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "Error fetching group ID", Error)
		return
	}

	groupData, err := app.Queries.FetchGroupData(id, userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusNoContent, "Error fetching group data", Error)
		return
	}
	app.JSONResponse(w, r, http.StatusOK, groupData, Success)
}
