package handler

import "net/http"

type Like struct {
	Id     string `json:"id"`
	Status bool   `json:"status"`
}

func (app *App) LikeComment(w http.ResponseWriter, r *http.Request) {}

func (app *App) LikePost(w http.ResponseWriter, r *http.Request) {}
