package handler

import (
	"fmt"
	"net/http"
)

func (app *App) Profile(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}

	// Fetch user data from the database
	userData, err := app.Queries.FetchUserData(userID)
	if err != nil {
		fmt.Println("Error fetching user data:", err)
		app.JSONResponse(w, r, http.StatusInternalServerError, "failed to fetch user data", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, userData, Success)
}
