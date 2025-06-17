package model

import (
	"database/sql"
	"time"
)

type User struct {
	ID                string    `json:"id"`
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

type UserNotification struct {
	ID         string         `json:"id"`
	ActorId    string         `json:"sender_id"`
	Type       string         `json:"type"`
	EntityID   sql.NullInt64  `json:"entity_id,omitempty"`
	EntityType sql.NullString `json:"entity_type,omitempty"`
	IsRead     bool           `json:"is_read"`
	Message    string         `json:"message"`
	CreatedAt  time.Time      `json:"created_at"`
}
