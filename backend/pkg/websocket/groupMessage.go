package websocket

import (
	"encoding/json"
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
		message.Message,
	})
	if err != nil {
		c.SendError("Failed to send message")
		return
	}
	
}
