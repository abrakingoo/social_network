package model

import "time"

type GroupData struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	About     string    `json:"about"`
	Creator   Creator   `json:"Creator"`
	CreatedAt time.Time `json:"created_at"`
	Posts     []Post    `json:"group_post"`
	Members   []Creator `json:"members"`
	Events    []Events  `json:"Events"`
}

type Events struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Creator     Creator   `json:"creator"`
	EventTime   time.Time `json:"event_time"`
	CreatedAt   time.Time `json:"created_at"`
	Attendees   []Creator `json:"attendees"`
	Location    string    `json:"location"`
}
