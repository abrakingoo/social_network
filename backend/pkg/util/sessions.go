package util

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

// GenerateCSRFToken generates a random CSRF token
func GenerateCSRFToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SetSessionCookie sets the session and CSRF cookies
func SetSessionCookie(w http.ResponseWriter, sessionID, csrfToken string) error {
	// Set session cookie
	sessionCookie := &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		MaxAge:   86400, // 24 hours
		HttpOnly: true,  // Prevent XSS
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, sessionCookie)

	// Set CSRF cookie
	csrfCookie := &http.Cookie{
		Name:     "csrf_token",
		Value:    csrfToken,
		Path:     "/",
		MaxAge:   86400, // 24 hours
		HttpOnly: true,  // Prevent XSS
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, csrfCookie)

	return nil
}