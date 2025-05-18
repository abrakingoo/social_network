package repository

import (
	"database/sql"
	"social/pkg/model"
	"errors"
)

func (q *Query) FetchUserData(userid string) (model.UserData, error) {
	var user model.UserData

	// fetch the user data first
	if err := q.fetchUserInfo(userid, &user); err != nil {
		return model.UserData{}, err
	}

	
	return user, nil
}

//fetchUserInfo first fetches userinfo from the user info table
func (q *Query) fetchUserInfo(userid string, user *model.UserData) error {
	row := q.Db.QueryRow(`
        SELECT email, first_name, last_name, 
		date_of_birth, avatar, nickname , about_me , 
		is_public
        FROM users 
        WHERE id = ? 
        LIMIT 1
    `, userid)

	err := row.Scan(&user.Email, &user.FirstName, &user.LastName, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe)
	if err == sql.ErrNoRows {
		return  errors.New("user not found by email or nickname")
	}
	if err != nil {
		return  err
	}

	return nil
}


