package handler

import (
	"fmt"
	"net/http"
)

func (app *App) Profile(w http.ResponseWriter, r *http.Request) {
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session cookie missing", Error)
		return
	}

	userID, err := app.Queries.FetchSessionUser(sessionCookie.Value)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session not found", Error)
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
