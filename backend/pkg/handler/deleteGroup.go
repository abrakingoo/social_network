package handler

import (
	"encoding/json"
	"net/http"
)

type DeleteGroup struct {
	Title string `json:"title"`
}

func (app *App) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}

	groupDetail := DeleteGroup{}
	if err := json.NewDecoder(r.Body).Decode(&groupDetail); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	err = app.Queries.DeleteGroup(groupDetail.Title, userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, err.Error(), Error)
		return
	}
}
