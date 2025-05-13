package handler

import (
	"context"
	"net/http"
	"strings"

	"social/pkg/middleware"
)

type contextKey string

const JWTUserKey = contextKey("jwt_payload")

// JWTMiddleware validates the JWT and injects payload into request context
func (app *App) JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		// Expect "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]

		payload, err := middleware.ValidateJWTToken(token)
		if err != nil {
			http.Error(w, "Invalid or expired token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Add payload to request context
		ctx := context.WithValue(r.Context(), JWTUserKey, payload)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
