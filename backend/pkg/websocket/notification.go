package websocket

func (h *Hub) ActionBasedNotification(recipients []string, action string, data any) {
	payload := map[string]any{
		"type":        "notification",
		"action_type": action,
		"data":        data,
	}

	h.BroadcastToSpecific(recipients, payload)
}

func (h *Hub) InfoBasedNotification(recipients []string, message string) {}
