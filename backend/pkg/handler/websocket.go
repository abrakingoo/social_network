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

func (app *App) HandleWebsocket(w http.ResponseWriter, r *http.Request) {
	userID, err := app.GetSessionData(r)
	if err != nil {
		app.JSONResponse(w, r, http.StatusUnauthorized, "unauthorized", Error)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		app.JSONResponse(w, r, http.StatusBadRequest, "failed to upgrade connection", Error)
		return
	}

	groupIDs, err := app.Queries.GetUserGroupIDs(userID)
	if err != nil {
		app.JSONResponse(w, r, http.StatusInternalServerError, "failed to load groups", Error)
		return
	}

	client := &socket.Client{
		UserID:      userID,
		Groups:      groupIDs,
		Conn:        conn,
		Send:        make(chan []byte, 256),
		ProcessChan: make(chan map[string]any, 100),
		Hubb:        app.Hub,
	}

	app.Hub.Register <- client
	defer client.Cleanup()

	go client.WritePump()
	go client.ProcessMessages(&app.Queries, app.Hub)
	client.ReadPump()
}
