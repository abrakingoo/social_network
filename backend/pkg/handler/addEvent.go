package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
)

func (app *App) AddEvent(w http.ResponseWriter, r *http.Request) {
	event := &model.Events{}
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	if event.Title == "" || event.EventTime.IsZero() {
		app.JSONResponse(w, r, http.StatusBadRequest, "missing required fields", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusCreated, "event added successfully", Success)
}
