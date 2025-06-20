package websocket

import "sync"

type Hub struct {
	Clients    map[*Client]bool
	Groups     map[string]map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Groups:     make(map[string]map[*Client]bool),
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
			for _, groupID := range c.Groups {
				if _, ok := h.Groups[groupID]; !ok {
					h.Groups[groupID] = make(map[*Client]bool)
				}
				h.Groups[groupID][c] = true
			}
			h.Mu.Unlock()

		case c := <-h.Unregister:
			h.Mu.Lock()
			delete(h.Clients, c)
			for _, groupID := range c.Groups {
				if members, ok := h.Groups[groupID]; ok {
					delete(members, c)
					if len(members) == 0 {
						delete(h.Groups, groupID) // cleanup empty group
					}
				}
			}
			h.Mu.Unlock()
		}
	}
}
