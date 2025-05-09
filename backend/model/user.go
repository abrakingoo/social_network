package model

import "time"

type User struct {
	ID                int       `json:"-" gorm:"primaryKey"`
	Email             string    `json:"email" gorm:"uniqueIndex;not null"`
	Password          string    `json:"password" gorm:"type:text;not null"`
	ConfirmedPassword string    `json:"confirmed_password" gorm:"-"`
	FirstName         string    `json:"first_name" gorm:"size:100;not null"`
	LastName          string    `json:"last_name" gorm:"size:100;not null"`
	DateOfBirth       time.Time `json:"date_of_birth" gorm:"type:date"`
	Avatar            string    `json:"avatar" gorm:"type:text"`
	Nickname          string    `json:"nickname" gorm:"size:50;uniqueIndex"`
	AboutMe           string    `json:"about_me" gorm:"type:text"`
	IsPublic          bool      `json:"is_public" gorm:"default:false"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
}
