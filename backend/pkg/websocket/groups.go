package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
)

func (c *Client) GroupJoinRequest(msg map[string]any, q *repository.Query) {
	dataBytes, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var request model.GroupRequest
	if err := json.Unmarshal(dataBytes, &request); err != nil {
		c.SendError("Invalid follow request data")
		return
	}

	admin, err := q.FetchGroupAdmin(request.GroupId)
	if err != nil {
		c.SendError("Error fetching group admin")
		return
	}

	if admin == c.UserID {
		c.SendError("Cannot to request to join your own group")
		return
	}

	exists, err := q.CheckRow("group_join_requests", []string{
		"group_id",
		"user_id,",
	}, []any{
		request.GroupId,
		c.UserID,
	})
	if err != nil {
		c.SendError("Error while checking status")
		return
	}

	declined, err := q.CheckRow("group_join_requests", []string{
		"group_id",
		"user_id,",
		"status",
	}, []any{
		request.GroupId,
		c.UserID,
		"declined",
	})
	if err != nil {
		c.SendError("Error while checking status")
		return
	}

	if exists && !declined {
		c.SendError("Request already sent")
		return
	}

	if exists {
		err = q.UpdateData("group_join_requests", []string{
			"group_id",
			"user_id",
		}, []any{
			request.GroupId,
			c.UserID,
		}, []string{
			"status",
		}, []any{
			"pending",
		})
		if err != nil {
			c.SendError("failed to update join request")
			return
		}
	} else {
		err = q.InsertData("group_join_requests", []string{
			"group_id",
			"user_id",
			"status",
		}, []any{
			request.GroupId,
			c.UserID,
			"pending",
		})
		if err != nil {
			c.SendError("failed to send join request")
			return
		}
	}
}

func (c *Client) RespondGroupJoinRequest(msg map[string]any, q *repository.Query) {
	dataBytes, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var request model.GroupRequest
	if err := json.Unmarshal(dataBytes, &request); err != nil {
		c.SendError("Invalid follow request data")
		return
	}

	admin, err := q.FetchGroupAdmin(request.GroupId)
	if err != nil {
		c.SendError("Error fetching group admin")
		return
	}

	if admin == c.UserID {
		c.SendError("Cannot to request to join your own group")
		return
	}
}
