package repository

import "time"

// DeleteSession deletes a session from the database using the session token.
func (q *Query) DeleteSession(sessionToken string) error {
	_, err := q.Db.Exec("DELETE FROM sessions WHERE session_token = ? OR expires_at < ?", sessionToken, time.Now())
	if err != nil {
		return err
	}
	return nil
}
