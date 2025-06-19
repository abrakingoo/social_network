package model

import "time"

type FollowRequest struct {
	RecipientID    string `json:"recipient_Id"`
	ResponseStatus string `json:"status"`
}

type GroupRequest struct {
	GroupId        string `json:"group_id"`
	ResponseStatus string `json:"status"`
	RecipientID    string `json:"recipient_Id"`
}

type PrivateMessage struct {
	RecipientID string    `json:"recipient_Id"`
	SenderID    string    `json:"sender_id"`
	Message     string    `json:"message"`
	ID          string    `json:"id"`
	ReceiverID  string    `json:"receiver_id"`
	Content     string    `json:"content"`
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}

type GroupMessage struct {
	GroupId string `json:"group_id"`
	Message string `json:"message"`
}

type Notification struct {
	NotificationId string `json:"notification_id"`
}
