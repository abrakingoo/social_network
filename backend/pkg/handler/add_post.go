package handler

import (
	"fmt"
	"net/http"
	"strings"
)

func (app *App) AddPost(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Failed to parse form data", Error)
		return
	}
	content := r.FormValue("content")
	file := r.FormValue("media")

	content = strings.Trim(content, " ")
	if content == "" {
		app.JSONResponse(w, r, http.StatusBadRequest, "Title and content cannot be empty", Error)
		return
	}

	fmt.Println("Content:", content)
	fmt.Println("File:", file)

	app.JSONResponse(w, r, http.StatusOK, "Post added successfully", Success)
}
