package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
	"social/pkg/util"
)

func (app *App) AddEvent(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}

	var event model.AddEventData
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	groupId, err := app.Queries.FetchGroupId(event.GroupTitle)
	if err != nil {
		app.JSONResponse(w, r, http.StatusNotFound, "group not found", Error)
		return
	}

	if event.Title == "" || event.EventTime.IsZero() {
		app.JSONResponse(w, r, http.StatusBadRequest, "missing required fields", Error)
		return
	}
	eventID := util.UUIDGen()
	err = app.Queries.InsertData("events", []string{
		"id",
		"title",
		"creator_id",
		"group_id",
		"event_time",
		"location",
		"description",
	}, []any{
		eventID,
		event.Title,
		userID,
		groupId,
		event.EventTime,
		event.Location,
		event.Description,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "failed to add event", Error)
		return
	}

	// NOTE: Notification creation removed - now handled by WebSocket for real-time delivery

	app.JSONResponse(w, r, http.StatusCreated, "event added successfully", Success)
}


