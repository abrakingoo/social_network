package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	pongWait   = 60 * time.Second
	pingPeriod = 54 * time.Second
	writeWait  = 10 * time.Second
)

// readPump reads raw frames, unmarshals, and pushes into processChan
func (c *Client) ReadPump() {
	defer func() {
		c.Hubb.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, raw, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected close: %v", err)
			}
			break
		}
		var msg map[string]any
		if err := json.Unmarshal(raw, &msg); err != nil {
			c.SendError("Invalid JSON")
			continue
		}
		c.ProcessChan <- msg
	}
}

// writePump drains c.send and emits ping frames
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(msg)
			// flush queued
			for i := 0; i < len(c.Send); i++ {
				w.Write([]byte("\n"))
				w.Write(<-c.Send)
			}
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
