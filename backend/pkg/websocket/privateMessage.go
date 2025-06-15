package websocket

import (
	"encoding/json"
	"strings"

	"social/pkg/model"
	"social/pkg/repository"
)

func (c *Client) PrivateMessage(msg map[string]any, q *repository.Query, h *Hub) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var private model.PrivateMessage
	if err = json.Unmarshal(data, &private); err != nil {
		c.SendError("Invalid messsage format")
		return
	}

	if strings.TrimSpace(private.Message) == "" {
		c.SendError("Cannot send empty message")
		return
	}
}
