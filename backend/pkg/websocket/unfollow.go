package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
)

func (c *Client) Unfollow(msg map[string]any, q *repository.Query) {
	dataBytes, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var request model.FollowRequest
	if err := json.Unmarshal(dataBytes, &request); err != nil {
		c.SendError("Invalid follow request data")
		return
	}

	exists, status, err := q.FollowExists(c.UserID, request.RecipientID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	if !exists {
		c.SendError("No follow request found.")
		return
	}

	if status != "accepted" {
		c.SendError("You don't follow this user")
	}

	err = q.DeleteData("user_follows", []string{
		"follower_id",
		"following_id",
	}, []any{
		c.UserID,
		request.RecipientID,
	})
	if err != nil {
		c.SendError("Error while deleting the follower")
	}
}
