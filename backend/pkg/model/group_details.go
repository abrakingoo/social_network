package model

import "time"

type GroupData struct {
	ID              string             `json:"id"`
	Title           string             `json:"title"`
	About           string             `json:"about"`
	Creator         Creator            `json:"Creator"`
	CreatedAt       time.Time          `json:"created_at"`
	Posts           []Post             `json:"group_post"`
	Members         []Creator          `json:"members"`
	Events          []Events           `json:"Events"`
	JoinRequest     []GroupJoinRequest `json:"join_request"`
	UserJoinRequest *GroupJoinRequest  `json:"user_join_request,omitempty"`
}

type Events struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Creator        Creator   `json:"creator"`
	EventTime      time.Time `json:"event_time"`
	CreatedAt      time.Time `json:"created_at"`
	RsvpCount      int       `json:"rsvp_count"`
	Attendees      []Creator `json:"attendees"`
	Location       string    `json:"location"`
	UserRsvpStatus string    `json:"user_rsvp_status"`
}

type Groups struct {
	ID              string            `json:"id"`
	Title           string            `json:"title"`
	About           string            `json:"about"`
	Creator         Creator           `json:"creator"`
	CreatedAt       time.Time         `json:"created_at"`
	MembersCount    int               `json:"members_count"`
	IsJoined        bool              `json:"is_joined"`
	UserRole        string            `json:"user_role"`
	UserJoinRequest *GroupJoinRequest `json:"user_join_request,omitempty"`
}

type GroupJoinRequest struct {
	ID        string      `json:"id"`
	UserID    string      `json:"user_id"`
	User      UserSummary `json:"user"`
	CreatedAt time.Time   `json:"created_at"`
	Status    string      `json:"status"`
}

type UserSummary struct {
	ID        string `json:"id"`
	Firstname string `json:"firstname"`
	Lastname  string `json:"lastname"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
}
