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

func (c *Client) RespondSendInvitation(msg map[string]any, q *repository.Query) {
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

	isMember, err := q.CheckRow("group_members", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		c.UserID,
	})
	if err != nil {
		c.SendError("error while checking user membership")
		return
	}

	admin, err := q.FetchGroupAdmin(request.GroupId)
	if err != nil {
		c.SendError("Error fetching group admin")
		return
	}

	if isMember {
		c.SendError("You are already a user")
		return
	}

	if request.ResponseStatus == "accepted" {
		err = q.InsertData("group_members", []string{
			"id",
			"group_id",
			"user_id",
			"role",
		}, []any{
			util.UUIDGen(),
			request.GroupId,
			c.UserID,
			"member",
		})
		if err != nil {
			c.SendError("failed to add user")
			return
		}
	}
	err = q.UpdateData("group_invitations", []string{
		"group_id",
		"sender_id",
		"receiver_id",
	}, []any{
		request.GroupId,
		admin,
		c.UserID,
	}, []string{
		"status",
	}, []any{
		request.ResponseStatus,
	})
	if err != nil {
		c.SendError("Failed to update invitation status")
		return
	}
}
