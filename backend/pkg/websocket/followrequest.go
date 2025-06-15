package websocket

import (
	"encoding/json"
	"fmt"
	"time"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) FollowRequest(msg map[string]any, q *repository.Query, h *Hub) {
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

	if request.RecipientID == c.UserID {
		c.SendError("You can't follow yourself")
		return
	}

	if request.RecipientID == "" {
		c.SendError("No recipient found")
		return
	}

	exists, status, err := q.FollowExists(c.UserID, request.RecipientID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	user := &model.UserData{}

	err = q.FetchUserInfo(request.RecipientID, user)
	if err != nil {
		c.SendError("Error fetching recipient data")
		return
	}

	notId := util.UUIDGen()

	if exists && status != "declined" {
		c.SendError("Error: request already sent")
		return
	} else if exists && status == "declined" {
		err = q.UpdateData("user_follows", []string{
			"following_id",
			"follower_id",
		}, []any{
			request.RecipientID,
			c.UserID,
		}, []string{
			"status",
			"updated_at",
		}, []any{
			"pending",
			time.Now(),
		})
		if err != nil {
			res := fmt.Sprintf("Error while updating follow status: %v", err)
			c.SendError(res)
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
			request.RecipientID,
			c.UserID,
			"follow_request",
			"new follow request",
		})
		if err != nil {
			c.SendError("failed to notify the recipient")
			return
		}

		h.ActionBasedNotification([]string{
			request.RecipientID,
		}, "follow_request", map[string]any{
			"follower": user,
		})
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

		err = q.InsertData("notifications", []string{
			"id",
			"recipient_id",
			"actor_id",
			"type",
			"message",
		}, []any{
			notId,
			request.RecipientID,
			c.UserID,
			"follow_request",
			"new follower",
		})
		if err != nil {
			c.SendError("failed to notify the recipient")
			return
		}

		h.InfoBasedNotification([]string{
			request.RecipientID,
		}, map[string]any{
			"avatar":  user.Avatar,
			"message": fmt.Sprintf("%v %v started following you", user.FirstName, user.LastName),
		})
	} else {
		err = q.InsertData("user_follows", []string{
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
		if err != nil {
			c.SendError("Failed to send follow request")
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
			request.RecipientID,
			c.UserID,
			"follow_request",
			"new follow request",
		})
		if err != nil {
			c.SendError("failed to notify the recipient")
			return
		}

		h.ActionBasedNotification([]string{
			request.RecipientID,
		}, "follow_request", map[string]any{
			"follower": user,
		})
	}
}

func (c *Client) RespondFollowRequest(msg map[string]any, q *repository.Query) {
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

	if request.RecipientID == c.UserID {
		c.SendError("You can't respond to yourself")
		return
	}

	if request.RecipientID == "" {
		c.SendError("No recipient found")
		return
	}

	exists, status, err := q.FollowExists(request.RecipientID, c.UserID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	if !exists {
		c.SendError("Error: No follow request found.")
		return
	}

	if status == "accepted" || status == "declined" {
		c.SendError("Error: already responded to this request")
		return
	}

	err = q.UpdateData("user_follows", []string{
		"follower_id",
		"following_id",
	}, []any{
		request.RecipientID,
		c.UserID,
	}, []string{
		"status",
		"updated_at",
	}, []any{
		request.ResponseStatus,
		time.Now(),
	})
	if err != nil {
		res := fmt.Sprintf("Error while updating follow status: %v", err)
		c.SendError(res)
	}
}

func (c *Client) CancelFollowRequest(msg map[string]any, q *repository.Query) {
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

	if request.RecipientID == c.UserID {
		c.SendError("You can't cancel yourself")
		return
	}

	if request.RecipientID == "" {
		c.SendError("No recipient found")
		return
	}

	exists, status, err := q.FollowExists(c.UserID, request.RecipientID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	if !exists {
		c.SendError("You have not sent a request to this user")
		return
	}

	if status == "pending" {
		err = q.DeleteData("user_follows", []string{
			"follower_id",
			"following_id",
			"status",
		}, []any{
			c.UserID,
			request.RecipientID,
			"pending",
		})
		if err != nil {
			c.SendError("failed to cancel request")
			return
		}
	} else {
		c.SendError("You have not sent a request to this user")
		return
	}
}
