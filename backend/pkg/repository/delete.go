package repository

// DeleteSession deletes a session from the database using the session token.
func (q *Query) DeleteSession(sessionToken string) error {
	_, err := q.Db.Exec("DELETE FROM sessions WHERE session_token = ?", sessionToken)
	if err != nil {
		return err
	}
	return nil
}
