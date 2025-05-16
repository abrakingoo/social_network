package handler

import "net/http"

func (app *App) GetPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := app.Queries.FetchPostWithMedia()
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Error fetching posts", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, posts, Data)
}
