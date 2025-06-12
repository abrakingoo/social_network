package repository

import (
	"database/sql"
	"fmt"
)

// CheckForRsvp checks whether a row with the given userID and eventID exists
// in the event_attendance table.
//
// Parameters:
// - userID: the ID of the user to check
// - eventID: the ID of the event to check
//
// Returns:
// - bool: true if a matching row exists, false otherwise
// - error: any error encountered during query execution

func (q *Query) CheckForRsvp(eventID , userID string) (bool, error) {
	query := `
		SELECT 1
		FROM event_attendance
		WHERE user_id = ? AND event_id = ?
		LIMIT 1;
	`

	var exists int
	err := q.Db.QueryRow(query, userID, eventID).Scan(&exists)
	if err != nil {
		if err == sql.ErrNoRows {
			// Row does not exist
			return false, nil
		}
		// Some other error occurred
		return false, fmt.Errorf("query error: %w", err)
	}

	// Row exists
	return true, nil
}