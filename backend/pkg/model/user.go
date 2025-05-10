package model

import "time"

type User struct {
	ID                int       `json:"-"`
	Email             string    `json:"email"`
	Password          string    `json:"password"`
	ConfirmedPassword string    `json:"confirmed_password"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	DateOfBirth       time.Time `json:"date_of_birth"`
	Avatar            string    `json:"avatar"`
	Nickname          string    `json:"nickname"`
	AboutMe           string    `json:"about_me"`
	IsPublic          bool      `json:"is_public"`
	CreatedAt         time.Time `json:"created_at"`
}
