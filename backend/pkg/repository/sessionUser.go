package repository

import (
	"database/sql"
	"fmt"
)

// Query represents the database query structure
func (q *Query) FetchSessionUser(sessionID string) (string, error) {
	query := `
		SELECT user_id 
		FROM sessions 
		WHERE session_token = ?
	`
	var userID string
	err := q.Db.QueryRow(query, sessionID).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", fmt.Errorf("failed to fetch session user: %w", err)
	}
	return userID, nil
}
