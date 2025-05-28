package handler

import (
	"encoding/base64"
	"net/http"
	"strings"
	"time"

	"social/pkg/util"
)

func (app *App) Login(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	if !strings.HasPrefix(authHeader, "Basic ") {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	payload, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(authHeader, "Basic "))
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	// Split into email and password
	parts := strings.SplitN(string(payload), ":", 2)
	if len(parts) != 2 {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	emailOrNickname, password := parts[0], parts[1]

	// Credentials validation
	userId, encryptedPassword, err := app.Queries.GetUserCredentials(emailOrNickname)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	// check password hash if it matches
	if err := util.ValidatePassword(password, encryptedPassword); err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	// Fetch user data
	userData, err := app.Queries.GetUserData(userId)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to fetch user data", Error)
		return
	}

	sessionID := util.UUIDGen()
	csrfToken, err := util.GenerateCSRFToken()
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Internal server error", Error)
		return
	}

	err = util.SetSessionCookie(w, sessionID, csrfToken)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Internal server error", Error)
		return
	}

	err = app.Queries.InsertData("sessions", []string{
		"id",
		"user_id",
		"session_token",
		"csrf_token",
		"expires_at",
	}, []any{
		util.UUIDGen(),
		userId,
		sessionID,
		csrfToken,
		time.Now().Add(24 * time.Hour),
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Internal server error", Error)
		return
	}

	// Send success response with user data
	response := map[string]interface{}{
		"message": "Login successful",
		"user":    userData,
	}
	app.JSONResponse(w, r, http.StatusOK, response, Success)
}

// CheckAuth verifies the session and returns user data
func (app *App) CheckAuth(w http.ResponseWriter, r *http.Request) {
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
	var userID string
	err = app.Queries.Db.QueryRow(`
		SELECT expires_at, user_id FROM sessions
		WHERE session_token = ? AND csrf_token = ?`,
		sessionCookie.Value, csrfToken.Value).Scan(&expiresAt, &userID)

	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session not found", Error)
		return
	}

	if time.Now().After(expiresAt) {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: session expired", Error)
		return
	}

	// Fetch user data
	userData, err := app.Queries.GetUserData(userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to fetch user data", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, map[string]interface{}{
		"user": userData,
	}, Success)
}
