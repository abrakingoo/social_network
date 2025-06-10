package handler

import (
	"encoding/json"
	"net/http"
	"strings"

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

	// Generate group ID
	groupID := util.UUIDGen()

	// Start a transaction
	tx, err := app.Queries.Db.Begin()
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to start transaction", Error)
		return
	}
	defer tx.Rollback()

	// Insert the group
	_, err = tx.Exec(`
		INSERT INTO groups (id, title, description, creator_id, members_count)
		VALUES (?, ?, ?, ?, 1)
	`, groupID, addGroupData.Title, addGroupData.Description, userID)
	if err != nil {
		// Check for duplicate title error specifically
		if strings.Contains(err.Error(), "UNIQUE constraint failed: groups.title") {
			app.JSONResponse(w, r, http.StatusConflict, "Group with this title already exists", Error)
			return
		}
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to create group", Error)
		return
	}

	// Add creator as admin member
	_, err = tx.Exec(`
		INSERT INTO group_members (id, group_id, user_id, role)
		VALUES (?, ?, ?, 'admin')
	`, util.UUIDGen(), groupID, userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to add creator as member", Error)
		return
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to commit transaction", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "Group created successfully", Success)
}
