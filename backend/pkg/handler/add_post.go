package handler

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"social/pkg/util"
)

func (app *App) AddPost(w http.ResponseWriter, r *http.Request) {
	path := ""
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Failed to parse form data", Error)
		return
	}
	content := r.FormValue("content")
	file := r.FormValue("media")

	content = strings.Trim(content, " ")
	if content == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Title and content cannot be empty", Error)
		return
	}

	if file != "" {
		f, err := os.Open(file)
		if err != nil {
			app.JSONResponse(w, r, http.StatusBadRequest, "Failed to open file", Error)
			return
		}
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

		err = app.Queries.InsertData("posts", []string{
			"id",
			"user_id",
			"content",
			"image",
		}, []any{
			util.UUIDGen(),
			"fff",
			content,
			path,
		})
		if err != nil {
			app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to insert data into database", Error)
			return
		}

		app.JSONResponse(w, r, http.StatusOK, "Post added successfully", Success)
	}

	fmt.Println("Content:", content)
	fmt.Println("File:", file)

	app.JSONResponse(w, r, http.StatusOK, "Post added successfully", Success)
}
