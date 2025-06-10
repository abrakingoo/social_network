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
