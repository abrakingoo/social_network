package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
)

func (c *Client) CancelGroupInvitation(msg map[string]any, q *repository.Query) {
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

	if admin != c.UserID {
		c.SendError("Only group admin can cancel join invitations")
		return
	}

	exists, err := q.CheckRow("group_invitations", []string{
		"group_id",
		"receiver_id",
		"sender_id",
		"status",
	}, []any{
		request.GroupId,
		request.RecipientID,
		c.UserID,
		"pending",
	})
	if err != nil {
		c.SendError("Error while checking invitations")
		return
	}

	if !exists {
		c.SendError("This invitation was not found")
		return
	}

	err = q.DeleteData("group_invitations", []string{
		"group_id",
		"receiver_id",
		"sender_id",
		"status",
	}, []any{
		request.GroupId,
		request.RecipientID,
		c.UserID,
		"pending",
	})
	if err != nil {
		c.SendError("Failed to cancel invitation")
		return
	}
}
