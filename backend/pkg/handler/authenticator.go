package handler

import (
	"database/sql"
	"net/http"
	"time"
)

// AuthMiddleware validates the session and CSRF token
func (app App) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract cookies
		sessionCookie, err := r.Cookie("session_id")
		if err != nil {
			app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session cookie missing", Error)
			return
		}

		csrfToken, err := r.Cookie("csrf_token")
		if err != nil {
			app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: CSRF cookie missing", Error)
			return
		}

		// Check session validity in the database
		var expiresAt time.Time
		err = app.Queries.Db.QueryRow(`
			SELECT expires_at FROM sessions 
			WHERE session_token = ? AND csrf_token = ?`,
			sessionCookie.Value, csrfToken).Scan(&expiresAt)

		if err == sql.ErrNoRows {
			app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session not found", Error)
			return
		} else if err != nil {
			app.JSONResponse(w, r, http.StatusInternalServerError, "Internal server error", Error)
			return
		}

		if time.Now().After(expiresAt) {
			app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session expired", Error)
			return
		}

		next.ServeHTTP(w, r)
	})
}
