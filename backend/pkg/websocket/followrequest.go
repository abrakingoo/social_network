package websocket

import (
	"encoding/json"
	"fmt"
	"time"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

// FollowService encapsulates follow request operations.
// It keeps the repository and hub for notifications.
type FollowService struct {
	Query *repository.Query
	Hub   *Hub
}

// decodeFollowRequest unmarshals the incoming message data into a FollowRequest struct.
func (c *Client) decodeFollowRequest(msg map[string]any) (model.FollowRequest, bool) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return model.FollowRequest{}, false
	}

	var req model.FollowRequest
	if err := json.Unmarshal(data, &req); err != nil {
		c.SendError("Invalid follow request data")
		return model.FollowRequest{}, false
	}
	return req, true
}

// validateNotSelf ensures the user is not performing the action on themselves.
func (c *Client) validateNotSelf(targetID string, action string) bool {
	if targetID == c.UserID {
		c.SendError(fmt.Sprintf("You can't %s yourself", action))
		return false
	}
	if targetID == "" {
		c.SendError("No recipient found")
		return false
	}
	return true
}

// sendNotification wraps inserting a notification row and issuing a hub event.
func (svc *FollowService) sendNotification(notifID, recipientID, actorID, ntype, message string, payload map[string]any, actionBased bool) {
	err := svc.Query.InsertData("notifications",
		[]string{"id", "recipient_id", "actor_id", "type", "message"},
		[]any{notifID, recipientID, actorID, ntype, message},
	)
	if err != nil {
		return
	}

	if actionBased {
		svc.Hub.ActionBasedNotification([]string{recipientID}, ntype, payload)
	} else {
		svc.Hub.InfoBasedNotification([]string{recipientID}, payload)
	}
}

// FollowRequest handles sending, re-sending, or auto-accepting follow requests.
func (c *Client) FollowRequest(msg map[string]any, q *repository.Query, h *Hub) {
	svc := FollowService{Query: q, Hub: h}

	req, ok := c.decodeFollowRequest(msg)
	if !ok {
		return
	}

	if !c.validateNotSelf(req.RecipientID, "follow") {
		return
	}

	isReal, err := q.CheckRow("users", []string{
		"id",
	}, []any{
		req.RecipientID,
	})

	if !isReal || err != nil {
		c.SendError("Error: recipient does not exist")
		return
	}

	exists, status, err := q.FollowExists(c.UserID, req.RecipientID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	var user model.UserData
	if err := q.FetchUserInfo(req.RecipientID, &user); err != nil {
		c.SendError("Error fetching recipient data")
		return
	}
	user.ID = c.UserID

	notifID := util.UUIDGen()

	if exists {
		svc.handleExistingFollow(c, req, status, &user, notifID)
		return
	}

	svc.handleNewFollow(c, req, &user, notifID)
}

func (svc *FollowService) handleExistingFollow(c *Client, req model.FollowRequest, status string, user *model.UserData, notifID string) {
	if status != "declined" {
		c.SendError("Error: request already sent")
		return
	}

	err := svc.Query.UpdateData(
		"user_follows",
		[]string{"following_id", "follower_id"},
		[]any{req.RecipientID, c.UserID},
		[]string{"status", "updated_at"},
		[]any{"pending", time.Now()},
	)
	if err != nil {
		c.SendError(fmt.Sprintf("Error while updating follow status: %v", err))
		return
	}

	svc.sendNotification(notifID, req.RecipientID, c.UserID, "follow_request", "new follow request",
		map[string]any{"follower": user}, true,
	)
}

func (svc *FollowService) handleNewFollow(c *Client, req model.FollowRequest, user *model.UserData, notifID string) {
	isPublic, err := svc.Query.CheckUserIsPublic(req.RecipientID)
	if err != nil {
		c.SendError("Error while checking user data")
		return
	}

	followID := util.UUIDGen()
	if isPublic {
		err = svc.Query.InsertData("user_follows",
			[]string{"id", "follower_id", "following_id", "status"},
			[]any{followID, c.UserID, req.RecipientID, "accepted"},
		)
		if err != nil {
			c.SendError("Failed to create follow record")
			return
		}

		svc.sendNotification(notifID, req.RecipientID, c.UserID, "follow_request", "new follower",
			map[string]any{"avatar": user.Avatar, "message": fmt.Sprintf("%v %v started following you", user.FirstName, user.LastName)}, false,
		)
	} else {
		err = svc.Query.InsertData("user_follows",
			[]string{"id", "follower_id", "following_id", "status"},
			[]any{followID, c.UserID, req.RecipientID, "pending"},
		)
		if err != nil {
			c.SendError("Failed to send follow request")
			return
		}

		svc.sendNotification(notifID, req.RecipientID, c.UserID, "follow_request", "new follow request",
			map[string]any{"follower": user}, true,
		)
	}
}

// RespondFollowRequest handles accept or decline of a pending request.
func (c *Client) RespondFollowRequest(msg map[string]any, q *repository.Query) {
	req, ok := c.decodeFollowRequest(msg)
	if !ok {
		return
	}

	if !c.validateNotSelf(req.RecipientID, "respond to") {
		return
	}

	isReal, err := q.CheckRow("users", []string{
		"id",
	}, []any{
		req.RecipientID,
	})

	if !isReal || err != nil {
		c.SendError("Error: recipient does not exist")
		return
	}

	exists, status, err := q.FollowExists(req.RecipientID, c.UserID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	if !exists {
		c.SendError("Error: No follow request found.")
		return
	}
	if status != "pending" {
		c.SendError("Error: already responded to this request")
		return
	}

	err = q.UpdateData(
		"user_follows",
		[]string{"follower_id", "following_id"},
		[]any{req.RecipientID, c.UserID},
		[]string{"status", "updated_at"},
		[]any{req.ResponseStatus, time.Now()},
	)
	if err != nil {
		c.SendError(fmt.Sprintf("Error while updating follow status: %v", err))
	}
}

// CancelFollowRequest deletes a pending follow request.
func (c *Client) CancelFollowRequest(msg map[string]any, q *repository.Query) {
	req, ok := c.decodeFollowRequest(msg)
	if !ok {
		return
	}

	if !c.validateNotSelf(req.RecipientID, "cancel") {
		return
	}

	exists, status, err := q.FollowExists(c.UserID, req.RecipientID)
	if err != nil {
		c.SendError("Error while checking following status")
		return
	}

	if !exists || status != "pending" {
		c.SendError("You have not sent a request to this user")
		return
	}

	err = q.DeleteData(
		"user_follows",
		[]string{"follower_id", "following_id", "status"},
		[]any{c.UserID, req.RecipientID, "pending"},
	)
	if err != nil {
		c.SendError("Failed to cancel request")
	}
}
