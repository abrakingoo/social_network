package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/util"
)

type AddGroupData struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// AddGroup handles the addition of a new group
func (app *App) AddGroup(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	var addGroupData AddGroupData
	err = json.NewDecoder(r.Body).Decode(&addGroupData)
	if err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Invalid JSON data", Error)
		return
	}

	if addGroupData.Title == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Title cannot be empty", Error)
		return
	}

	err = app.Queries.InsertData("groups", []string{
		"id",
		"title",
		"description",
		"creator_id",
	}, []any{
		util.UUIDGen(),
		addGroupData.Title,
		addGroupData.Description,
		userID,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to create group", Error)
		return
	}
	app.JSONResponse(w, r, http.StatusOK, "Group created successfully", Success)
}
