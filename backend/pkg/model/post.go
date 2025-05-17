package model

import "time"

type Post struct {
	ID            string    `json:"id"`
	GroupID       string    `json:"group_id"`
	Content       string    `json:"content"`
	LikesCount    int       `json:"likes_count"`
	DislikesCount int       `json:"dislikes_count"`
	CommentsCount int       `json:"comments_count"`
	Comments      []Comment `json:"comments"`
	Media         []Media   `json:"media"`
	Privacy       string    `json:"privacy"`
	CreatedAt     time.Time `json:"created_at"`
}

type Comment struct {
	ID            string    `json:"id"`
	PostID        string    `json:"post_id"`
	UserID        string    `json:"user_id"`
	GroupID       string    `json:"group_id"`
	Content       string    `json:"content"`
	Media         []Media   `json:"media"`
	LikesCount    int       `json:"likes_count"`
	DislikesCount int       `json:"dislikes_count"`
	CreatedAt     time.Time `json:"created_at"`
}

type Media struct {
	URL string `json:"url"`
}
