package handler

import (
	"encoding/json"
	"net/http"
)

type Like struct {
	PostId    string `json:"post_id"`
	CommentId string `json:"comment_id"`
}

func (app *App) LikeComment(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "Unauthorized", Error)
		return
	}

	like := Like{}

	if err = json.NewDecoder(r.Body).Decode(&like); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "invalid request body", Error)
		return
	}

	if like.CommentId == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "No comment provided", Error)
		return
	}

	exist, err := app.Queries.CheckRow("comment_likes", []string{
		"comment_id",
		"user_id",
	}, []any{
		like.CommentId,
		userID,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "Error while checking like status", Error)
		return
	}

	if exist {
		status := true
		isTrue, err := app.Queries.CheckRow("comment_likes", []string{
			"comment_id",
			"user_id",
			"is_like",
		}, []any{
			like.CommentId,
			userID,
			true,
		})
		if err != nil {
			app.JSONResponse(w, r, http.StatusConflict, "Error while checking like status", Error)
			return
		}

		if isTrue {
			status = false
		}
	}
}

func (app *App) LikePost(w http.ResponseWriter, r *http.Request) {}
