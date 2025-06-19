package websocket

import (
	"encoding/json"
	"html"
	"strings"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) PrivateMessage(msg map[string]any, q *repository.Query, h *Hub) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var private model.PrivateMessage
	if err = json.Unmarshal(data, &private); err != nil {
		c.SendError("Invalid messsage format")
		return
	}

	isReal, err := q.CheckRow("users", []string{
		"id",
	}, []any{
		private.RecipientID,
	})

	if !isReal || err != nil {
		c.SendError("Error: recipient does not exist")
		return
	}

	if strings.TrimSpace(private.Message) == "" {
		c.SendError("Cannot send empty message")
		return
	}

	if private.RecipientID == "" {
		c.SendError("recipient not found")
		return
	}

	err = q.InsertData("private_messages", []string{
		"id",
		"sender_id",
		"receiver_id",
		"content",
	}, []any{
		util.UUIDGen(),
		c.UserID,
		private.RecipientID,
		html.EscapeString(private.Message),
	})
	if err != nil {
		c.SendError("failed to send message")
		return
	}

	var user model.UserData

	err = q.FetchUserInfo(c.UserID, &user)
	if err != nil {
		c.SendError("failed to show message to recipient")
		return
	}
	user.ID = c.UserID

	notId := util.UUIDGen()
	err = q.InsertData("notifications", []string{
		"id",
		"recipient_Id",
		"actor_id",
		"type",
		"message",
	}, []any{
		notId,
		private.RecipientID,
		c.UserID,
		"private_message",
		private.Message,
	})
	if err != nil {
		c.SendError("failed to notify the recipient")
		return
	}

	h.ActionBasedNotification([]string{
		private.RecipientID,
	}, "private_message", map[string]any{
		"id":      notId,
		"sender":  user,
		"message": html.EscapeString(private.Message),
	})
}

func (c *Client) ReadPrivateMessage(msg map[string]any, q *repository.Query) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var private model.PrivateMessage
	if err = json.Unmarshal(data, &private); err != nil {
		c.SendError("Invalid data format")
		return
	}

	if private.SenderID == "" {
		c.SendError("The sender not found")
		return
	}

	err = q.UpdateData("private_messages", []string{
		"sender_id",
		"receiver_id",
	}, []any{
		private.SenderID,
		c.UserID,
	}, []string{
		"is_read",
	}, []any{
		true,
	})
	if err != nil {
		c.SendError("Failed to update chat read status")
		return
	}
}
