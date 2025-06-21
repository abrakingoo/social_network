package websocket

import (
	"encoding/json"
	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) GroupJoinRequest(msg map[string]any, q *repository.Query, h *Hub) {
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
		c.SendError("Cannot request to join your own group")
		return
	}

	pendingOrAccepted, err := q.CheckRow("group_join_requests", []string{
		"group_id",
		"user_id",
		"status",
	}, []any{
		request.GroupId,
		c.UserID,
		"pending",
	})
	if err != nil {
		c.SendError("Error while checking status")
		return
	}
	if !pendingOrAccepted {
		pendingOrAccepted, err = q.CheckRow("group_join_requests", []string{
			"group_id",
			"user_id",
			"status",
		}, []any{
			request.GroupId,
			c.UserID,
			"accepted",
		})
		if err != nil {
			c.SendError("Error while checking status")
			return
		}
	}

	if pendingOrAccepted {
		c.SendError("Request already sent")
		return
	}

	notId := util.UUIDGen()

	_ = q.DeleteData("group_join_requests", []string{
		"group_id",
		"user_id",
		"status",
	}, []any{
		request.GroupId,
		c.UserID,
		"declined",
	})

	err = q.InsertData("group_join_requests", []string{
		"id",
		"group_id",
		"user_id",
		"status",
	}, []any{
		util.UUIDGen(),
		request.GroupId,
		c.UserID,
		"pending",
	})
	if err != nil {
		c.SendError("failed to send join request")
		return
	}

	err = q.InsertData("notifications", []string{
		"id",
		"recipient_id",
		"actor_id",
		"type",
		"message",
	}, []any{
		notId,
		admin,
		c.UserID,
		"group_join_request",
		"new request to join group",
	})
	if err != nil {
		c.SendError("failed to notify the recipient")
		return
	}

	h.ActionBasedNotification([]string{
		admin,
	}, "group_join_request", map[string]any{
		"group_id": request.GroupId,
		"request":  fetchLatestJoinRequest(q, request.GroupId, c.UserID),
	})
}

func (c *Client) RespondGroupJoinRequest(msg map[string]any, q *repository.Query, h *Hub) {
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
		c.SendError("Only group admin can respond to join requests")
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
		c.SendError("Error while checking membership")
		return
	}

	if isMember {
		c.SendError("The user is already a member")
		return
	}

	inJoin, err := q.CheckRow("group_join_requests", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		request.RecipientID,
	})
	if err != nil {
		c.SendError("Error while checking join request")
		return
	}

	if !inJoin {
		c.SendError("No request to respond to")
		return
	}

	err = q.UpdateData("group_join_requests", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		request.RecipientID,
	}, []string{
		"status",
	}, []any{
		request.ResponseStatus,
	})
	if err != nil {
		c.SendError("Error wupdating join request status")
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
			request.RecipientID,
			"member",
		})
		if err != nil {
			c.SendError("Error adding user as a member to the group")
			return
		}
		// Send real-time notification to the user
		h.ActionBasedNotification([]string{
			request.RecipientID,
		}, "group_join_accept", map[string]any{
			"group_id": request.GroupId,
			"status":   "accepted",
		})
	} else if request.ResponseStatus == "declined" {
		// Send real-time notification to the user for declined
		h.ActionBasedNotification([]string{
			request.RecipientID,
		}, "group_join_accept", map[string]any{
			"group_id": request.GroupId,
			"status":   "declined",
		})
	}
}

// Helper function to fetch the latest join request with user info
func fetchLatestJoinRequest(q *repository.Query, groupID, userID string) *model.GroupJoinRequest {
	var group model.GroupData
	if err := q.FetchGroupJoinRequest(groupID, &group); err != nil {
		return nil
	}
	for _, req := range group.JoinRequest {
		if req.UserID == userID {
			return &req
		}
	}
	return nil
}
