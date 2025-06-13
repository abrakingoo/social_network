package handler

import (
	"fmt"
	"net/http"
)

func (app *App) GetPosts(w http.ResponseWriter, r *http.Request) {
	// fetch userif to filter the post
	userID, err := app.GetSessionData(r)
	if err != nil {
		fmt.Println(err)
		app.JSONResponse(w, r, http.StatusUnauthorized, "Getpost: unathorized ", Error)
		return
	}

	posts, err := app.Queries.FetchAllPosts(userID)
	if err != nil {
		fmt.Println(err)
		app.JSONResponse(w, r, http.StatusInternalServerError, "Error fetching posts", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, posts, Data)
}
