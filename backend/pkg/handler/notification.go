package handler

import "net/http"

func (app *App) Notifications(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	notifications, err := app.Queries.GetUserNotifications(userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "Error while fetching notifications", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, notifications, Success)
}
