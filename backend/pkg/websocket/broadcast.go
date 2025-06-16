package websocket

import (
	"encoding/json"
	"log"
)

// Broadcast a payload to all clients except skip (or nil to send to all)
func (h *Hub) BroadcastToOthers(skip *Client, payload map[string]any) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Println("broadcastToOthers: marshal error:", err)
		return
	}
	h.Mu.RLock()
	defer h.Mu.RUnlock()
	for client := range h.Clients {
		if client == skip {
			continue
		}
		select {
		case client.Send <- data:
		default:
		}
	}
}

func (h *Hub) BroadcastToSpecific(users []string, payload map[string]any) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Println("specific broadcast error:", err)
		return
	}

	for _, v := range users {
		go h.SendIfActive(v, data)
	}
}

func (h *Hub) SendIfActive(userID string, data []byte) {
	h.Mu.RLock()
	defer h.Mu.RUnlock()

	for client := range h.Clients {
		if client.UserID == userID {
			select {
			case client.Send <- data:
			default:
			}
			return
		}
	}
}

func (h *Hub) BroadcastToGroup(skip *Client, groupID string, data []byte) {
	h.Mu.RLock()
	defer h.Mu.RUnlock()

	clients, ok := h.Groups[groupID]
	if !ok {
		return
	}
	for client := range clients {
		if client == skip {
			continue
		}
		select {
		case client.Send <- data:
		default:
		}
	}
}
