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

func (q *Query) CheckForRsvp(eventID, userID string) (bool, error) {
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

func (q *Query) FetchAttendingMembersCount(eventID string) (int, error) {

	if eventID == "" {
		return 0, fmt.Errorf("FetchAttendingMembersCount: eventID cannot be empty")
	}

	query := `
		SELECT e.going_count
		FROM events e
		WHERE id = ?
	`

	var count int
	err := q.Db.QueryRow(query, eventID).Scan(&count)
	if err != nil {
		if err == sql.ErrNoRows {
			// Row does not exist
			return 0, fmt.Errorf("FetchAttendingMembersCount: no event found with ID %s", eventID)
		}
		// Some other error occurred
		return 0, fmt.Errorf("FetchAttendingMembersCount : query error : %w", err)
	}

	return count, nil

}

// GetUserRsvpStatus checks the current user's RSVP status for an event
func (q *Query) GetUserRsvpStatus(eventID, userID string) (string, error) {
	query := `
			SELECT status
			FROM event_attendance
			WHERE user_id = ? AND event_id = ?
			LIMIT 1;
	`

	var status string
	err := q.Db.QueryRow(query, userID, eventID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			// User hasn't RSVP'd yet
			return "not_going", nil
		}
		return "", fmt.Errorf("query error: %w", err)
	}

	return status, nil
}
