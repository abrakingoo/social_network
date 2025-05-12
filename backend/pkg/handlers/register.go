package handlers

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

// Register handles user registration
func (app *App) Register(w http.ResponseWriter, r *http.Request) {
	var user model.User

	if r.Method != http.MethodPost {
		app.JSONResponse(w, r, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		app.JSONResponse(w,r , http.StatusBadRequest, "Bad request")
	}

	hashed, err := util.EncryptPassword(user.Password)
	if err != nil {
		util.SendErr(w, "Failed to register user. Try again later.", http.StatusInternalServerError)
		return
	}

	err = repository.InsertData(app.Queries, "users", []string{
		"email",
		"password",
		"first_name",
		"last_name",
		"date_of_birth",
		"avatar",
		"nickname",
		"about_me",
		"is_public",
	}, []any{
		user.Email,
		hashed,
		user.FirstName,
		user.LastName,
		user.DateOfBirth,
		user.Avatar,
		user.Nickname,
		user.AboutMe,
		user.IsPublic,
	})
	if err != nil {
		util.SendErr(w, "Failed to register user. Try again later.", http.StatusInternalServerError)
		return
	}

	util.Success(w, "User registered successfully")
}
