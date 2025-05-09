package handler

import (
	"net/http"

	"social/pkg/model"
)

func Register(w http.ResponseWriter, r *http.Request) {
	var user model.User
	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
}
