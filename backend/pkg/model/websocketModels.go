package model

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
	RecipientID string `json:"recipient_Id"`
	Message     string `json:"message"`
}

type GroupMessage struct {
	GroupId string `json:"group_id"`
	Message string `json:"message"`
}

type Notification struct {
	NotificationId string `json:"notification_id"`
}
