package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) FollowRequest(msg map[string]any, q *repository.Query) {
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

	exists, _, err := q.FollowExists(c.UserID, request.RecipientID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	if exists {
		c.SendError("Error: request already sent")
		return
	}

	isPublic, err := q.CheckUserIsPublic(request.RecipientID)
	if err != nil {
		c.SendError("Error while checking user data")
		return
	}

	if isPublic {
		q.InsertData("user_follows", []string{
			"id",
			"follower_id",
			"following_id",
			"status",
		}, []any{
			util.UUIDGen(),
			c.UserID,
			request.RecipientID,
			"accepted",
		})
	} else {
		q.InsertData("user_follows", []string{
			"id",
			"follower_id",
			"following_id",
			"status",
		}, []any{
			util.UUIDGen(),
			c.UserID,
			request.RecipientID,
			"pending",
		})
	}
}
