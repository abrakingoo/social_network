package handler

import (
	"html"
	"io"
	"net/http"
	"os"
	"strings"

	"social/pkg/util"
)

type Comment struct {
	PostId    string `json:"post_id"`
	Content   string `json:"content"`
	CommentId string `json:"comment_id"`
}

func (app *App) AddComment(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Failed to parse form data", Error)
		return
	}

	comment := Comment{}

	comment.PostId = r.FormValue("post_id")
	comment.Content = r.FormValue("content")
	comment.CommentId = r.FormValue("comment_id")

	if strings.TrimSpace(comment.Content) == "" || strings.TrimSpace(comment.CommentId) == "" || strings.TrimSpace(comment.PostId) == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Empty comment not allowed", Error)
		return
	}

	files := r.MultipartForm.File["media"]

	// If file was provided, process it
	if len(files) > 0 {
		for _, header := range files {
			var path string
			file, err := header.Open()
			if err != nil {
				app.JSONResponse(w, r, http.StatusBadRequest, "Failed to open comment file", Error)
				return
			}

			defer file.Close()

			// Save file temporarily
			tempFilePath := "/tmp/" + header.Filename
			out, err := os.Create(tempFilePath)
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Could not save uploaded comment file", Error)
				return
			}
			defer out.Close()

			_, err = io.Copy(out, file)
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to write uploaded comment file", Error)
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
				comment.CommentId,
			})
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to insert media into database", Error)
				return
			}
		}
	}

	err = app.Queries.InsertData("comments", []string{
		"id",
		"post_id",
		"user_id",
		"content",
	}, []any{
		comment.CommentId,
		comment.PostId,
		userID,
		html.EscapeString(comment.Content),
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnprocessableEntity, "Comment not added", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "Comment added successfully", Success)
}
