package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	"social/pkg/util"
)

// AddPost handles the addition of a new post
func (app *App) AddPost(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Failed to parse form data", Error)
		return
	}

	content := strings.TrimSpace(r.FormValue("content"))
	if content == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Content cannot be empty", Error)
		return
	}

	postId := util.UUIDGen()

	files := r.MultipartForm.File["media"]

	// If file was provided, process it
	if len(files) > 0 {
		for _, header := range files {
			var path string
			file, err := header.Open()
			if err != nil {
				app.JSONResponse(w, r, http.StatusBadRequest, "Failed to open file", Error)
				return
			}

			defer file.Close()

			// Save file temporarily
			tempFilePath := "/tmp/" + header.Filename
			out, err := os.Create(tempFilePath)
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Could not save uploaded file", Error)
				return
			}
			defer out.Close()

			_, err = io.Copy(out, file)
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to write uploaded file", Error)
				return
			}

			f, _ := os.Open(tempFilePath)
			defer f.Close()

			mimetype, err := util.IsValidMimeType(f)
			if err != nil {
				app.JSONResponse(w, r, http.StatusBadRequest, "Invalid file type", Error)
				return
			}

			switch mimetype {
			case "image/jpeg":
				path, err = util.CompressJPEG(tempFilePath, 70)
			case "image/png":
				path, err = util.CompressPNG(tempFilePath)
			case "image/gif":
				path, err = util.CompressGIF(tempFilePath, true)
			default:
				path = "pkg/db/media/" + header.Filename
			}

			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to compress file", Error)
				return
			}

			err = app.Queries.InsertData("media", []string{
				"id",
				"url",
				"parent_id",
			}, []any{
				util.UUIDGen(),
				path,
				postId,
			})
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to insert media into database", Error)
				return
			}
		}
	}

	privacy := r.FormValue("privacy")
	if privacy != "public" && privacy != "private" && privacy != "almost_private" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Invalid privacy setting", Error)
		return
	}

	groupId := r.FormValue("group_id")
	if groupId != "" {
		isReal, err := app.Queries.CheckRow("groups", []string{
			"id",
		}, []any{
			groupId,
		})
		if err != nil || !isReal {
			app.JSONResponse(w, r, http.StatusBadRequest, "Invalid group ID", Error)
			return
		}
	}

	err = app.Queries.InsertData("posts", []string{
		"id",
		"user_id",
		"content",
		"privacy",
	}, []any{
		postId,
		userID,
		content,
		privacy,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to insert post into database", Error)
		return
	}

	if privacy == "private" {
		raw := r.FormValue("visible_to")
		var userIDs []string

		err := json.Unmarshal([]byte(raw), &userIDs)
		if err != nil {
			app.JSONResponse(w, r, http.StatusBadRequest, "Invalid visible_to field", Error)
			return
		}

		for _, id := range userIDs {
			if id == userID {
				continue
			}

			isReal, err := app.Queries.CheckRow("users", []string{
				"id",
			}, []any{
				id,
			})
			if err != nil || !isReal {
				app.JSONResponse(w, r, http.StatusBadRequest, "Invalid user ID in visible_to field", Error)
				return
			}

			err = app.Queries.InsertData("post_visibility", []string{
				"id",
				"post_id",
				"user_id",
			}, []any{
				util.UUIDGen(),
				postId,
				id,
			})
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to insert post visibility into database", Error)
				return
			}
		}
	}

	app.JSONResponse(w, r, http.StatusOK, "Post added successfully", Success)
}
