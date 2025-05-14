package handler

import (
	"encoding/json"
	"net/http"
)

type Message int

const (
	Success Message = iota
	Error
	Token
)

func (s Message) String() string {
	return [...]string{"message", "error", "token"}[s]
}

func (app *App) JSONResponse(w http.ResponseWriter, r *http.Request, status int, message string, messageType Message) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{messageType.String(): message})
}
