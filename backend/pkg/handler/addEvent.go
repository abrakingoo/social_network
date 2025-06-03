package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
)

func (app *App) AddEvent(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}

	event := &model.Events{}
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
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
	}, []any{
		event.Title,
		userID,
		event.EventTime,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "failed to add event", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusCreated, "event added successfully", Success)
}
