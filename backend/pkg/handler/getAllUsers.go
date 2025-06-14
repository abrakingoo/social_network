package handler

import (
	"net/http"
	"social/pkg/model"

)


func (app *App) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unathorized", Error)
		return
	}

	users, err := app.Queries.FetchAllUsers(userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusNoContent, "Error fetching users", Error)
		return
	}

	if len(users) == 0 {
        app.JSONResponse(w, r, http.StatusOK, []model.User{}, Success)
        return
    }

	app.JSONResponse(w, r, http.StatusOK, users, Success)
}
