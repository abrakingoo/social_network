package model

import "time"


type Post struct {
	ID             string    `json:"id"`
	Group_id       string    `json:"group_id"`
	Content        string    `json:"content"`
	Likes_count    string    `json:"likes_count"`
	Dislikes_count string    `json:"dislikes_count"`
	Comments_count string    `json:"comments_count"`
	Privacy        string    `json:"privacy"`
	CreatedAt      time.Time `json:"created_at"`
}

