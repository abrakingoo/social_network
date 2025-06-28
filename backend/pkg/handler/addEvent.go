package handler

import (
	"encoding/json"
	"fmt"
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

	eventStr := fmt.Sprintf("created event - %s ", event.Title)
	err = app.Queries.InsertData("notifications", []string{
		"id",
		"actor_id",
		"recipient_id",
		"recipient_group_id",
		"type",
		"message",
		"entity_id",
		"entity_type",
	}, []any{
		util.UUIDGen(),
		userID,
		"",
		groupId,
		"group_event",
		eventStr,
		eventID,
		"group-event",
	})

	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "failed to add event notification", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusCreated, "event added successfully", Success)
}
