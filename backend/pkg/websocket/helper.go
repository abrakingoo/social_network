package websocket

import (
	"encoding/json"
	"log"
)

func (c *Client) SendError(text string) {
	payload, _ := json.Marshal(map[string]string{
		"type":    "error",
		"message": text,
	})
	select {
	case c.Send <- payload:
	default:
		log.Println("sendError: channel full")
	}
}

func (c *Client) SendResponse(msgType string, payload map[string]string) {
	payload["type"] = msgType
	data, err := json.Marshal(payload)
	if err != nil {
		log.Println("sendResponse: JSON marshal error:", err)
		return
	}
	select {
	case c.Send <- data:
	default:
		log.Println("sendResponse: channel full")
	}
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
