package util

import (
	"encoding/json"
	"net/http"
)

// SendErr is a utility function to send an error response in JSON format
func SendErr(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

// Success is a utility function to send a success response in JSON format
func Success(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": message,
	})
}
