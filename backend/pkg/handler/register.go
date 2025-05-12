package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

// Register handles user registration
func (app *App) Register(w http.ResponseWriter, r *http.Request) {
	var user model.User
	err, code, msgs := user.ValidateUserDetails(w, r)
	if err != nil {
		msg := ""
		for _, value := range msgs {
			msg += strings.Join(value, "\n") + "\n"
		}
		app.JSONResponse(w, r, code, msg)
		return
	}

	if r.Method != http.MethodPost {
		app.JSONResponse(w, r, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "Bad request")
	}

	hashed, err := util.EncryptPassword(user.Password)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to register user. Try again later.")
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
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to register user. Try again later.")
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "User registered successfully")
}
