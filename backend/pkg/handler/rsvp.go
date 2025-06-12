package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"social/pkg/util"
)

type Rsvp struct {
	ID     string `json:"eventId"`
	Status string `json:"status"`
}

func (app *App) Rsvp(w http.ResponseWriter, r *http.Request) {
	rsvp := Rsvp{}

	userID, err := app.GetSessionData(r)
	if err != nil {
		fmt.Println(err)
		app.JSONResponse(w, r, http.StatusUnauthorized, "Getpost: unathorized ", Error)
		return
	}

	if err = json.NewDecoder(r.Body).Decode(&rsvp); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	rsvped, err := app.Queries.CheckForRsvp(rsvp.ID, userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnprocessableEntity, "Error while processing data", Error)
		return
	}

	if !rsvped {
		app.Queries.InsertData("event_attendance", []string{
			"id",
			"event_id",
			"user_id",
			"status",
		}, []any{
			util.UUIDGen(),
			rsvp.ID,
			userID,
			rsvp.Status,
		})
	} else {
		app.Queries.UpdateData("event_attendance", []string{
			"event_id",
			"user_id",
		}, []any{
			rsvp.ID,
			userID,
		}, []string{
			"status",
		}, []any{
			rsvp.Status,
		})
	}
}
