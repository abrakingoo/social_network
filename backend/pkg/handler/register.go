package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
	"social/pkg/util"
)

// Register handles user registration
func (app *App) Register(w http.ResponseWriter, r *http.Request) {
	var user model.User
	code, msgs, err := model.ValidateUserDetails(w, r, &user)
	if err != nil {
		if len(msgs) > 0 {
			formErrors, err := json.Marshal(msgs)
			if err != nil {
				app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to generate json response", Error)
				return
			}
			app.JSONResponse(w, r, http.StatusNotAcceptable, string(formErrors), Error)
			return

		}
		app.JSONResponse(w, r, code, err.Error(), Error)
		return
	}

	hashed, err := util.EncryptPassword(user.Password)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to register user. Try again later.", Error)
		return
	}

	err = app.Queries.InsertData("users", []string{
		"id",
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
		util.UUIDGen(),
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
		app.JSONResponse(w, r, http.StatusInternalServerError, "Failed to register user. Try again later.", Error)
		return
	}

	app.JSONResponse(w, r, http.StatusOK, "User registered successfully", Success)
}
