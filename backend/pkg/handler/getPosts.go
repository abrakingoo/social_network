package handler

import (
	"fmt"
	"net/http"
)

func (app *App) GetPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := app.Queries.FetchAllPosts()
	if err != nil {
		fmt.Println(err)
		app.JSONResponse(w, r, http.StatusInternalServerError, "Error fetching posts", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, posts, Data)
}
