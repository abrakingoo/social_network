package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
)

func (c *Client) ExitGroup(msg map[string]any, q *repository.Query, h *Hub) {
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
		c.SendError("Admins can't exit group")
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

	if !isMember {
		c.SendError("Not a member of the group")
		return
	}

	err = q.DeleteData("group_members", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		c.UserID,
	})
	if err != nil {
		c.SendError("Failed to exit group. try again later")
		return
	}

	// Clean up any join requests for this user/group (set to 'declined')
	err = q.UpdateData("group_join_requests", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		c.UserID,
	}, []string{"status"}, []any{"declined"})
	// Ignore error if no join request exists

	// Send real-time notification to user and admin (optional)
	if h != nil {
		h.ActionBasedNotification([]string{c.UserID, admin}, "group_left", map[string]any{
			"group_id": request.GroupId,
			"user_id": c.UserID,
		})
	}
}
