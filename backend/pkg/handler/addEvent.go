package handler

import (
	"encoding/json"
	"net/http"
	"time"
)

type AddEventData struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventTime   time.Time `json:"event_time"`
	GroupTitle  string    `json:"group_title"`
	Location    string    `json:"location"`
}

func (app *App) AddEvent(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}

	event := AddEventData{}
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

	err = app.Queries.InsertData("events", []string{
		"title",
		"creator_id",
		"group_id",
		"event_time",
		"location",
		"description",
	}, []any{
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

	app.JSONResponse(w, r, http.StatusCreated, "event added successfully", Success)
}
