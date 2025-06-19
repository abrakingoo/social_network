package websocket

import (
	"encoding/json"
	"html"
	"log"
	"strings"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) GroupMessage(msg map[string]any, q *repository.Query, h *Hub) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var message model.GroupMessage
	if err = json.Unmarshal(data, &message); err != nil {
		c.SendError("Invalid messsage format")
		return
	}

	if strings.TrimSpace(message.Message) == "" {
		c.SendError("Cannot send empty message")
		return
	}

	if message.GroupId == "" {
		c.SendError("No group provided")
		return
	}

	err = q.InsertData("group_messages", []string{
		"id",
		"group_id",
		"sender_id",
		"content",
	}, []any{
		util.UUIDGen(),
		message.GroupId,
		c.UserID,
		html.EscapeString(message.Message),
	})
	if err != nil {
		c.SendError("Failed to send message")
		return
	}

	var user model.UserData
	err = q.FetchUserInfo(c.UserID, &user)
	if err != nil {
		c.SendError("failed to notify active group members")
		return
	}

	user.ID = c.UserID

	raw := map[string]any{
		"sender":  user,
		"message": message.Message,
	}

	userData, err := json.Marshal(raw)
	if err != nil {
		log.Println("failed to marshal userdata: ", err)
		c.SendError("Failed to notify active group members")
		return
	}

	payload := map[string]any{
		"type":        "notification",
		"case":        "action_based",
		"action_type": "group_message",
		"data":        userData,
	}

	groupData, err := json.Marshal(payload)
	if err != nil {
		log.Println("failed to marshal userdata: ", err)
		c.SendError("Failed to notify active group members")
		return
	}

	h.BroadcastToGroup(c, message.GroupId, groupData)
}

func (c *Client) LoadGroupMessages(msg map[string]any, q *repository.Query) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var message model.GroupMessage
	if err = json.Unmarshal(data, &message); err != nil {
		c.SendError("Invalid messsage format")
		return
	}

	isReal, err := q.CheckRow("group_members", []string{
		"group_id",
		"user_id",
	}, []any{
		message.GroupId,
		c.UserID,
	})
	if !isReal || err != nil {
		c.SendError("You are not a member of this group")
		return
	}
}
