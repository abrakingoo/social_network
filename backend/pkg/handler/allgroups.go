package handler

import "net/http"

func (app *App) GetAllGroups(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	groups, err := app.Queries.FetchAllGroups(userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to fetch groups", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, groups, Success)
}
