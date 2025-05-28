package repository

func (q *Query) DeleteSession(sessionID string) error {
	_, err := q.Db.Exec("DELETE FROM sessions WHERE session_token = ?", sessionID)
	if err != nil {
		return err
	}
	return nil
}
