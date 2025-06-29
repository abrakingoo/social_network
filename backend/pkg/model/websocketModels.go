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
	GroupId   string      `json:"group_id"`
	Message   string      `json:"message"`
	ID        string      `json:"id"`
	SenderID  string      `json:"sender_id"`
	Content   string      `json:"content"`
	CreatedAt time.Time   `json:"created_at"`
	Sender    UserSummary `json:"sender"`
}

type Notification struct {
	NotificationId string `json:"notification_id"`
}

type AddEventData struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventTime   time.Time `json:"event_time"`
	GroupTitle  string    `json:"group_title"`
	Location    string    `json:"location"`
}
