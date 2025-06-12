package handler

import (
	"net/http"
)


func (app *App) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := app.Queries.FetchAllUsers()
	if err != nil {
		app.JSONResponse(w, r, http.StatusNoContent, "Error fetching users", Error)
		return
	}
	app.JSONResponse(w, r, http.StatusOK, users, Success)
}
