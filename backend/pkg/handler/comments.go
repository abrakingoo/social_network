package handler

import (
	"html"
	"net/http"
	"strings"
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

	if strings.TrimSpace(comment.Content) == "" || strings.TrimSpace(comment.CommentId) == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Empty comment not allowed", Error)
		return
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
