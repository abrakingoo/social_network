package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type UserData struct {
	UserID string `json:"user_id"`
}

func (app *App) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		fmt.Println(err)
		app.JSONResponse(w, r, http.StatusUnauthorized, "Get Profile: unathorized ", Error)
		return
	}

	queryId := UserData{}
	if err := json.NewDecoder(r.Body).Decode(&queryId); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	isPublic, err := app.Queries.CheckRow("users", []string{
		"id",
		"is_public",
	}, []any{
		queryId.UserID,
		true,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Error checking user visibility", Error)
		return
	}

	isFollowing, err := app.Queries.CheckRow("user_follows", []string{
		"follower_id",
		"following_id",
	}, []any{
		userID,
		queryId.UserID,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Error checking follow status", Error)
		return
	}

	if !isPublic && !isFollowing {
		app.JSONResponse(w, r, http.StatusForbidden, "Profile is private", Error)
		return
	}
}
