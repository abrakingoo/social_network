package handler

import (
	"encoding/json"
	"net/http"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func Register(w http.ResponseWriter, r *http.Request) {
	var user model.User

	if r.Method != http.MethodPost {
		util.SendErr(w, "Method not allowed")
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		util.SendErr(w, "Bad request")
	}

	hashed, err := util.EncryptPassword(user.Password)
	if err != nil {
		util.SendErr(w, "Failed to register user. Try again later.")
		return
	}

	err = repository.InsertData(util.Db, "users", []string{
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
		util.SendErr(w, "Failed to register user. Try again later.")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User registered successfully",
	})
}
