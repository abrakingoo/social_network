package websocket

import (
	"log"

	"social/pkg/repository"
)

// processMessages dispatches on msg["type"]
func (c *Client) ProcessMessages(q *repository.Query) {
	for msg := range c.ProcessChan {
		log.Printf("User %s sent: %v", c.UserID, msg)
		switch msg["type"] {
		case "follow_request":
			c.FollowRequest(msg, q)
		default:
			c.SendError("Unknown message type")
		}
	}
}
