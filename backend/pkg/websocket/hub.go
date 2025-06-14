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
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
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
			if _, ok := h.Clients[c]; ok {
				delete(h.Clients, c)
				close(c.Send)
				close(c.ProcessChan)
			}
			h.Mu.Unlock()
		}
	}
}
