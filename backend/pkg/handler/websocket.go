// handler/ws.go
package handler

import (
	"net/http"

	socket "social/pkg/websocket"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func (app *App) ServeWS(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUpgradeRequired, "failed to upgrade connection", Error)
		return
	}
	client := &socket.Client{
		UserID:      userID,
		Conn:        conn,
		Send:        make(chan []byte, 256),
		ProcessChan: make(chan map[string]string, 100),
		Hubb:        app.Hub,
	}

	app.Hub.Register <- client
	go client.WritePump()
	go client.ProcessMessages()
	client.ReadPump()
}
