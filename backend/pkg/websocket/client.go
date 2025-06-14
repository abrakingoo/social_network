package websocket

import (
	"encoding/json"
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
