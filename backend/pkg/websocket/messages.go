package websocket

import "log"

// processMessages dispatches on msg["type"]
func (c *Client) ProcessMessages() {
	for msg := range c.ProcessChan {
		log.Printf("User %s sent: %v", c.UserID, msg)
		switch msg["type"] {
		default:
			c.SendError("Unknown message type")
		}
	}
}
