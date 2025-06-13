package model

type FollowRequest struct {
	RecipientID    string `json:"recipient_Id"`
	ResponseStatus string `json:"status"`
}

type GroupRequest struct {
	GroupId        string `json:"group_id"`
	ResponseStatus string `json:"status"`
}
