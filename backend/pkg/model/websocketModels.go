package model

type FollowRequest struct {
	RecipientID    string `json:"recipient_Id"`
	ResponseStatus string `json:"status"`
}
