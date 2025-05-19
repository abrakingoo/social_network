package handler

import (
	"fmt"
	"net/http"
)

func (app *App) Profile(w http.ResponseWriter, r *http.Request) {
	// Get the user ID from the request context
	payload := r.Context().Value(JWTUserKey)
	if payload == nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: no token context", Error)
		return
	}

	claims, ok := payload.(map[string]interface{})
	if !ok {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: invalid token data", Error)
		return
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: missing user ID", Error)
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
