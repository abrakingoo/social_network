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

func (h *Hub) BroadcastToSpecific(users []*Client, payload map[string]any) {}
