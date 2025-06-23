package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/util"
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
		// If the like exists, delete it (unlike)
		err = app.Queries.DeleteData("comment_likes", []string{
			"comment_id",
			"user_id",
		}, []any{
			like.CommentId,
			userID,
		})
		if err != nil {
			app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to delete like status", Error)
			return
		}
	} else {
		err = app.Queries.InsertData("comment_likes", []string{
			"id",
			"comment_id",
			"user_id",
			"is_like",
		}, []any{
			util.UUIDGen(),
			like.CommentId,
			userID,
			true,
		})
		if err != nil {
			app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to update like status", Error)
			return
		}
	}

	app.JSONResponse(w, r, http.StatusOK, "Like status updated successfully", Error)
}

func (app *App) LikePost(w http.ResponseWriter, r *http.Request) {
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

	if like.PostId == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "No post provided", Error)
		return
	}

	exist, err := app.Queries.CheckRow("post_likes", []string{
		"post_id",
		"user_id",
	}, []any{
		like.PostId,
		userID,
	})
	if err != nil {
		app.JSONResponse(w, r, http.StatusConflict, "Error while checking like status", Error)
		return
	}

	if exist {
		// If the like exists, delete it (unlike)
		err = app.Queries.DeleteData("post_likes", []string{
			"post_id",
			"user_id",
		}, []any{
			like.PostId,
			userID,
		})
		if err != nil {
			app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to unlike post", Error)
			return
		}
	} else {
		err = app.Queries.InsertData("post_likes", []string{
			"id",
			"post_id",
			"user_id",
			"is_like",
		}, []any{
			util.UUIDGen(),
			like.PostId,
			userID,
			true,
		})
		if err != nil {
			app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to update like status", Error)
			return
		}
	}

	app.JSONResponse(w, r, http.StatusOK, "Like status updated successfully", Error)
}
