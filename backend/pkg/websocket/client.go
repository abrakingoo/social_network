package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

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

// FIXED: Better cleanup with timeout to prevent blocking
func (c *Client) Cleanup() {
	c.Once.Do(func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered in Cleanup: %v", r)
			}
		}()

		// FIXED: Use goroutine with timeout to prevent blocking on unregister
		go func() {
			select {
			case c.Hubb.Unregister <- c:
				// Successfully unregistered
			case <-time.After(100 * time.Millisecond):
				// Timeout - channel might be full, continue cleanup anyway
			}
		}()

		// Close channels safely
		if c.ProcessChan != nil {
			close(c.ProcessChan)
		}

		// FIXED: Close send channel with delay to allow pending messages
		go func() {
			time.Sleep(50 * time.Millisecond)
			if c.Send != nil {
				close(c.Send)
			}
		}()

		// Close WebSocket connection
		if c.Conn != nil {
			_ = c.Conn.Close()
		}
	})
}

