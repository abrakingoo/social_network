package websocket

import (
	"encoding/json"

	"social/pkg/model"
	"social/pkg/repository"
)

func (h *Hub) ActionBasedNotification(recipients []string, action string, data any) {
	payload := map[string]any{
		"type":        "notification",
		"case":        "action_based",
		"action_type": action,
		"data":        data,
	}

	h.BroadcastToSpecific(recipients, payload)
}

func (h *Hub) InfoBasedNotification(recipients []string, info any) {
	payload := map[string]any{
		"type": "notification",
		"case": "info_based",
		"data": map[string]any{
			"info": info,
		},
	}

	h.BroadcastToSpecific(recipients, payload)
}

func (c *Client) ReadNotification(msg map[string]any, q *repository.Query) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var notification model.Notification
	if err = json.Unmarshal(data, &notification); err != nil {
		c.SendError("Invalid messsage format")
		return
	}

	if notification.NotificationId == "" {
		c.SendError("No notification found")
		return
	}

	exists, err := q.CheckRow("notifications", []string{
		"id",
		"recipient_Id",
	}, []any{
		notification.NotificationId,
		c.UserID,
	})
	if err != nil || !exists {
		c.SendError("Notification not found")
		return
	}

	err = q.UpdateData("notifications", []string{
		"id",
		"recipient_Id",
	}, []any{
		notification.NotificationId,
		c.UserID,
	}, []string{
		"is_read",
	}, []any{true})
	if err != nil {
		c.SendError("Failed to update notification read status")
	}
}
