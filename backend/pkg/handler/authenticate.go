package handler

import (
	"context"
	"net/http"

	"social/pkg/middleware"
)

type contextKey string

const JWTUserKey = contextKey("jwt_payload")

// JWTMiddleware validates the JWT and injects payload into request context
func (app *App) JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := middleware.ExtractJWTTokenFromHeader(r)
		if err != nil {
			app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
			return
		}

		payload, err := middleware.ValidateJWTToken(token)
		if err != nil {
			app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
			return
		}

		// Add payload to request context
		ctx := context.WithValue(r.Context(), JWTUserKey, payload)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
