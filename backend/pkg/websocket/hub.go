package websocket

import "sync"

type Hub struct {
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client, 100),
		Unregister: make(chan *Client, 100),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.Register:
			h.Mu.Lock()
			h.Clients[c] = true
			h.Mu.Unlock()

		case c := <-h.Unregister:
			h.Mu.Lock()
			if _, exists := h.Clients[c]; exists {
				delete(h.Clients, c)
			}
			h.Mu.Unlock()
		}
	}
}

// Simple method to send notification to specific user
func (h *Hub) NotifyUser(userID string, message []byte) {
	h.Mu.RLock()
	defer h.Mu.RUnlock()

	for client := range h.Clients {
		if client.UserID == userID {
			select {
			case client.Send <- message:
				// Successfully sent
			default:
				// Channel full, skip this client
			}
			break // Only send to one instance per user
		}
	}
}