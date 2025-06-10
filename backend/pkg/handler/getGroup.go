package handler

import (
	"net/http"
)

// GetGroupData handles the request to fetch group data based on the group title.
func (app *App) GetGroupData(w http.ResponseWriter, r *http.Request) {
	// Get title from query parameters
	groupTitle := r.URL.Query().Get("title")
	if groupTitle == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Title parameter is required", Error)
		return
	}

	id, err := app.Queries.FetchGroupId(groupTitle)
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "Error fetching group ID", Error)
		return
	}

	groupData, err := app.Queries.FetchGroupData(id)
	if err != nil {
		app.JSONResponse(w, r, http.StatusNoContent, "Error fetching group data", Error)
		return
	}
	app.JSONResponse(w, r, http.StatusOK, groupData, Success)
}
