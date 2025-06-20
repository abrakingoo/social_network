package websocket

import (
	"encoding/json"
	"fmt"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) SendInvitation(msg map[string]any, q *repository.Query, h *Hub) {
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

	notId := util.UUIDGen()

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

	// FIXED: Include group_id in the notification so frontend can access it
	err = q.InsertData("notifications", []string{
		"id",
		"recipient_id",
		"actor_id",
		"type",
		"message",
		"entity_id",      // ADDED: Store group_id here
		"entity_type",    // ADDED: Store entity type
	}, []any{
		notId,
		request.RecipientID,
		c.UserID,
		"group_invitation",
		"new group invitation request",
		request.GroupId,  // FIXED: Store the group_id
		"group",          // FIXED: Entity type for groups
	})
	if err != nil {
		c.SendError("failed to notify the recipient")
		return
	}

	h.ActionBasedNotification([]string{
		request.RecipientID,
	}, "group_invitation", map[string]any{
		"group_id": request.GroupId,
	})
}

// FIXED: Complete RespondSendInvitation function with proper logic
func (c *Client) RespondSendInvitation(msg map[string]any, q *repository.Query) {
	dataBytes, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var request model.GroupRequest
	if err := json.Unmarshal(dataBytes, &request); err != nil {
		c.SendError("Invalid group invitation data")
		return
	}

	// Validate required fields
	if request.GroupId == "" {
		c.SendError("Group ID is required")
		return
	}

	if request.ResponseStatus == "" {
		c.SendError("Response status is required")
		return
	}

	if request.ResponseStatus != "accepted" && request.ResponseStatus != "declined" {
		c.SendError("Invalid response status. Must be 'accepted' or 'declined'")
		return
	}

	// Check if invitation exists and is pending
	invitationExists, err := q.CheckRow("group_invitations", []string{
		"group_id",
		"receiver_id",
		"status",
	}, []any{
		request.GroupId,
		c.UserID,
		"pending",
	})
	if err != nil {
		c.SendError("Error checking invitation status")
		return
	}

	if !invitationExists {
		c.SendError("No pending invitation found")
		return
	}

	// Check if user is already a member
	isMember, err := q.CheckRow("group_members", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		c.UserID,
	})
	if err != nil {
		c.SendError("Error checking membership status")
		return
	}

	if isMember {
		c.SendError("User is already a member of this group")
		return
	}

	// Update invitation status
	err = q.UpdateData("group_invitations", []string{
		"group_id",
		"receiver_id",
		"status",
	}, []any{
		request.GroupId,
		c.UserID,
		"pending",
	}, []string{
		"status",
	}, []any{
		request.ResponseStatus,
	})
	if err != nil {
		c.SendError("Error updating invitation status")
		return
	}

	// If accepted, add user to group members
	if request.ResponseStatus == "accepted" {
		memberID := util.UUIDGen()
		err = q.InsertData("group_members", []string{
			"id",
			"group_id",
			"user_id",
			"role",
		}, []any{
			memberID,
			request.GroupId,
			c.UserID,
			"member",
		})
		if err != nil {
			c.SendError("Error adding user to group")
			return
		}

		// Send success response to client
		c.SendSuccess(fmt.Sprintf("Successfully joined group %s", request.GroupId))

		// Create system notification showing successful join
		systemNotificationID := util.UUIDGen()
		err = q.InsertData("notifications", []string{
			"id",
			"recipient_id",
			"actor_id",
			"type",
			"message",
			"entity_id",
			"entity_type",
		}, []any{
			systemNotificationID,
			c.UserID,
			"system", // System notification
			"group_join_success",
			"You have successfully joined the group",
			request.GroupId,  // Store group_id for reference
			"group",
		})
		if err != nil {
			// Don't return error here as the main operation succeeded
		}

	} else {
		// Send decline response to client
		c.SendSuccess(fmt.Sprintf("Group invitation for %s declined", request.GroupId))
	}
}