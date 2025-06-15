package model

import "time"

type UserData struct {
	ID            string     `json:"id"`
	FirstName     string     `json:"first_name"`
	LastName      string     `json:"last_name"`
	Email         string     `json:"email"`
	DateOfBirth   time.Time  `json:"date_of_birth"`
	Avatar        string     `json:"avatar"`
	Nickname      string     `json:"nickname"`
	AboutMe       string     `json:"about_me"`
	IsPublic      bool       `json:"is_public"`
	CreatedAt     time.Time  `json:"created_at"`
	Post          []Post     `json:"userposts"`
	Comments      []Post     `json:"commentedpost"`
	LikedPost     []Post     `json:"likedpost"`
	LikedComments []Post     `json:"likedcomments"`
	Followers     []Follower `json:"followers"`
	Following     []Follower `json:"following"`
}

type Follower struct {
	ID        string `json:"id"`
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
}
