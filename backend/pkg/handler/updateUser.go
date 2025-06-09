package handler

import "net/http"

func (app *App) UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "User updated successfully", Success)
}
