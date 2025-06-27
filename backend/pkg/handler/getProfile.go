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
		app.JSONResponse(w, r, http.StatusUnauthorized, "Getpost: unathorized ", Error)
		return
	}

	queryId := UserData{}
	if err := json.NewDecoder(r.Body).Decode(&queryId); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}
}
