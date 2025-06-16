// backend/pkg/websocket/groups.go - CORRECTED: Works with existing UserData model
package websocket

import (
	"encoding/json"
	"fmt"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
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
	}

	// Send notification to admin using existing methods
	c.notifyAdmin(admin, request.GroupId, q)
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

	// Check if user already exists in group_join_requests
	exists, err := q.CheckRow("group_join_requests", []string{
		"group_id",
		"user_id",
	}, []any{
		request.GroupId,
		request.RecipientID,
	})
	if err != nil {
		c.SendError("Error while checking request existence")
		return
	}

	if !exists {
		c.SendError("No request to respond to")
		return
	}

	// Update the request status
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
		c.SendError("Failed to update request status")
		return
	}

	// If accepted, add user to group members
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
			c.SendError("Failed to add user to group")
			return
		}
	}

	// Notify the requester using existing methods
	c.notifyRequester(request.RecipientID, request.GroupId, request.ResponseStatus, q)
}

// Simple notification to admin using existing FetchUserData (fixed ID issue)
func (c *Client) notifyAdmin(adminID, groupID string, q *repository.Query) {
	// Use existing FetchUserData to get requester info
	userData, err := q.FetchUserData(c.UserID)
	if err != nil {
		return // Silent fail for notifications
	}

	// Use existing FetchGroupData to get group info
	groupData, err := q.FetchGroupData(groupID)
	if err != nil {
		return // Silent fail for notifications
	}

	// Create simple notification message using c.UserID instead of userData.ID
	notification := map[string]interface{}{
		"type":        "notification",
		"case":        "action_based",
		"action_type": "group_join_request",
		"data": map[string]interface{}{
			"user": map[string]interface{}{
				"id":        c.UserID, // FIXED: Use c.UserID directly since UserData doesn't have ID field
				"firstname": userData.FirstName,
				"lastname":  userData.LastName,
				"nickname":  userData.Nickname,
				"avatar":    userData.Avatar,
			},
			"group": map[string]interface{}{
				"id":    groupData.ID,
				"title": groupData.Title,
			},
			"message": fmt.Sprintf("%s requested to join %s", userData.FirstName, groupData.Title),
		},
	}

	// Send using existing Hub method
	data, err := json.Marshal(notification)
	if err != nil {
		return // Silent fail for notifications
	}

	c.Hubb.NotifyUser(adminID, data)
}

// Simple notification to requester using existing methods
func (c *Client) notifyRequester(requesterID, groupID, status string, q *repository.Query) {
	// Use existing FetchGroupData to get group info
	groupData, err := q.FetchGroupData(groupID)
	if err != nil {
		return // Silent fail for notifications
	}

	var message string
	var actionType string
	if status == "accepted" {
		message = fmt.Sprintf("Your request to join %s has been accepted!", groupData.Title)
		actionType = "group_join_accept"
	} else {
		message = fmt.Sprintf("Your request to join %s has been declined.", groupData.Title)
		actionType = "group_join_decline"
	}

	// Create simple notification message
	notification := map[string]interface{}{
		"type":        "notification",
		"case":        "action_based",
		"action_type": actionType,
		"data": map[string]interface{}{
			"group": map[string]interface{}{
				"id":    groupData.ID,
				"title": groupData.Title,
			},
			"status":  status,
			"message": message,
		},
	}

	// Send using existing Hub method
	data, err := json.Marshal(notification)
	if err != nil {
		return // Silent fail for notifications
	}

	c.Hubb.NotifyUser(requesterID, data)
}