package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) SendInvitation(msg map[string]any, q *repository.Query) {
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
		c.SendError("Only group admin can send join invitations")
		return
	}

	isMember, err := q.CheckRow("group_members", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		request.RecipientID,
	})
	if err != nil {
		c.SendError("error while checking user membership")
		return
	}

	if isMember {
		c.SendError("User is already a member")
		return
	}

	err = q.InsertData("group_invitations", []string{
		"id",
		"group_id",
		"sender_id",
		"receiver_id",
		"status",
	}, []any{
		util.UUIDGen(),
		request.GroupId,
		c.UserID,
		request.RecipientID,
		"pending",
	})
	if err != nil {
		c.SendError("failed to send invitation")
		return
	}
}
