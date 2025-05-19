package util

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"
)

// GenerateCSRFToken creates a random, base64-encoded CSRF token
func GenerateCSRFToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// SetSessionCookie sets the session cookie and a CSRF token cookie
func SetSessionCookie(w http.ResponseWriter, sessionID, csrfToken string) error {
	// Set the session cookie
	sessionCookie := http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	}
	http.SetCookie(w, &sessionCookie)

	// Set the CSRF token cookie (not HttpOnly so frontend JS can read it)
	csrfCookie := http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		HttpOnly: false,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	}
	http.SetCookie(w, &csrfCookie)

	return nil
}
