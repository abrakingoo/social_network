package websocket

import "github.com/gorilla/websocket"

type Client struct {
	UserID      string
	Conn        *websocket.Conn
	Send        chan []byte
	ProcessChan chan map[string]string
	Hubb        *Hub
}
