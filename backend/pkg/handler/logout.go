package handler

import (
	"net/http"

	"social/pkg/util"
)

func (app *App) Logout(w http.ResponseWriter, r *http.Request) {
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session cookie missing", Error)
		return
	}

	_, err = app.Queries.FetchSessionUser(sessionCookie.Value)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session not found", Error)
		return
	}

	err = app.Queries.DeleteSession(sessionCookie.Value)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Internal server error", Error)
		return
	}

	util.ExpireSessionCookie(w)
}
