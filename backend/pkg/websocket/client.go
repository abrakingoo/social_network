package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	UserID      string
	Conn        *websocket.Conn
	Send        chan []byte
	ProcessChan chan map[string]any
	Hubb        *Hub
	Once        sync.Once
}

type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

func (c *Client) Cleanup() {
	c.Once.Do(func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("recover in Cleanup: %v", r)
			}
		}()

		select {
		case c.Hubb.Unregister <- c:
		default:
			log.Println("Unregister channel full or closed")
		}

		close(c.Send)

		_ = c.Conn.Close()
	})
}
