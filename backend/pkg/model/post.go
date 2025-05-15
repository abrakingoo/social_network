package model

import "time"

type Post struct {
	ID             string    `json:"id"`
	Group_id       string    `json:"group_id"`
	Content        string    `json:"content"`
	Likes_count    int       `json:"likes_count"`
	Dislikes_count int       `json:"dislikes_count"`
	Comments_count int       `json:"comments_count"`
	Comments       []Comment `json:"comments"`
	Media          []Media   `json:"media"`
	Privacy        string    `json:"privacy"`
	CreatedAt      time.Time `json:"created_at"`
}

type Comment struct {
	ID             string    `json:"id"`
	Post_id        string    `json:"post_id"`
	User_id        string    `json:"user_id"`
	Group_id       string    `json:"group_id"`
	Content        string    `json:"content"`
	Media          []Media   `json:"media"`
	Likes_count    int       `json:"likes_count"`
	Dislikes_count int       `json:"dislikes_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type Media struct {
	URL string `json:"url"`
}
