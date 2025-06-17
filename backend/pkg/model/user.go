package model

import "time"

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
	ID         string    `json:"id"`
	ActorId    string    `json:"sender_id"`
	Type       string    `json:"type"`
	EntityID   string    `json:"entity_id,omitempty"`
	EntityType string    `json:"entity_type,omitempty"`
	IsRead     bool      `json:"is_read"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"created_at"`
}

// id TEXT PRIMARY KEY NOT NULL UNIQUE,
//     recipient_id TEXT NOT NULL,
//     actor_id TEXT,
//     type TEXT NOT NULL,
//     entity_id INTEGER,
//     entity_type TEXT,
//     is_read BOOLEAN DEFAULT 0,
//     message TEXT,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
