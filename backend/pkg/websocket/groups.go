package websocket

import (
	"encoding/json"
	"fmt"

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

	exists, err := q.CheckRow("group_join_requests", []string{
		"group_id",
		"user_id",
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
		"user_id",
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

		h.ActionBasedNotification([]string{
			admin,
		}, "group_join_request", map[string]any{
			"group_id": request.GroupId,
		})
	} else {
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
			fmt.Println("This err: ", err)
			c.SendError("failed to send join request")
			return
		}

		h.ActionBasedNotification([]string{
			admin,
		}, "group_join_request", map[string]any{
			"group_id": request.GroupId,
		})
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
	}
}
