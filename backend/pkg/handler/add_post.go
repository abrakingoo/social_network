package handler

import (
	"fmt"
	"net/http"
)

func (app *App) AddPost(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Failed to parse form data", Error)
		return
	}

	// Get the form data
	title := r.FormValue("title")
	content := r.FormValue("content")
	file := r.FormValue("media")

	fmt.Println("Title:", title)
	fmt.Println("Content:", content)
	fmt.Println("File:", file)
}
