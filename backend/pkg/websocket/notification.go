package websocket

import "social/pkg/repository"

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

func (c *Client) ReadNotification(msg map[string]any, q *repository.Query) {}
