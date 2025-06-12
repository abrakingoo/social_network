package websocket

import (
	"github.com/gorilla/websocket"
	"encoding/json"
)

type Client struct {
	UserID      string
	Conn        *websocket.Conn
	Send        chan []byte
	ProcessChan chan map[string]any
	Hubb        *Hub
}

type Message struct {
	Type string				`json:"type"`;
	Data json.RawMessage	`json:"data"`;
}
