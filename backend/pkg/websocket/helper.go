package websocket

import (
	"encoding/json"
	"log"
)

// Simple error sender using existing patterns
func (c *Client) SendError(message string) {
	errorMsg := map[string]interface{}{
		"type":    "error",
		"message": message,
	}

	data, err := json.Marshal(errorMsg)
	if err != nil {
		return
	}

	select {
	case c.Send <- data:
		// Success
	default:
		// Channel full, ignore
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
