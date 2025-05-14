package handler

import (
	"net/http"
	"os"
	"strings"

	"social/pkg/util"
)

func (app *App) AddPost(w http.ResponseWriter, r *http.Request) {
	// Extract JWT payload from context
	payload := r.Context().Value(JWTUserKey)
	if payload == nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: no token context", Error)
		return
	}

	// Type assert the payload
	claims, ok := payload.(map[string]interface{})
	if !ok {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: invalid token data", Error)
		return
	}

	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized: missing user ID", Error)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Failed to parse form data", Error)
		return
	}

	content := r.FormValue("content")
	file := r.FormValue("media")

	content = strings.Trim(content, " ")
	if content == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Content cannot be empty", Error)
		return
	}

	// Handle media (if any)
	path := ""
	if file != "" {
		f, err := os.Open(file)
		if err != nil {
			app.JSONResponse(w, r, http.StatusBadRequest, "Failed to open file", Error)
			return
		}
		defer f.Close()

		mimetype, err := util.IsValidMimeType(f)
		if err != nil {
			app.JSONResponse(w, r, http.StatusBadRequest, "Invalid file type", Error)
			return
		}

		switch mimetype {
		case "image/jpeg":
			path, err = util.CompressJPEG(file, 70)
		case "image/png":
			path, err = util.CompressPNG(file)
		case "image/gif":
			path, err = util.CompressGIF(file, true)
		default:
			path = "backend/pkg/db/media" + file
		}
		if err != nil {
			app.JSONResponse(w, r, http.StatusBadRequest, "Failed to compress file", Error)
			return
		}
	}

	// Insert post
	err := app.Queries.InsertData("posts", []string{
		"id",
		"user_id",
		"content",
		"media",
	}, []any{
		util.UUIDGen(),
		userID,
		content,
		path,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to insert data into database", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "Post added successfully", Success)
}
