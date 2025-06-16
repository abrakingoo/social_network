package handler

import (
	"net/http"

)

func (app *App) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unathorized", Error)
		return
	}

	users, err := app.Queries.FetchAllUsers(userID)
	if err != nil {
		 app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to fetch users", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, users, Success)
}
