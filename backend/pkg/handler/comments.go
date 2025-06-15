package handler

import (
	"encoding/json"
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

	comment := Comment{}
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	if strings.TrimSpace(comment.Content) == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Empty comment not allowed")
		return
	}
}
