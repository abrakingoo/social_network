package models

import "time"

type User struct {
	Id                int       `json:"id"`
	Email             string    `json:"email"`
	Password          string    `json:"password"`
	ConfirmedPassword string    `json:"confirmed_password"`
	First_name        string    `json:"first_name"`
	Last_name         string    `json:"last_name"`
	Date_of_birth     string    `json:"date_of_birth"`
	Avatar            string    `json:"avatar"`
	Nickname          string    `json:"nickname"`
	About_me          string    `json:"about_me"`
	Is_public         bool      `json:"is_public"`
	Created_at        time.Time `json:"created_at"`
}
