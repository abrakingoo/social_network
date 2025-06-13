package repository

import (
	"database/sql"
	"fmt"
)

func (q *Query) FetchGroupAdmin(groupID string) (string, error) {
	query := `
		SELECT c.creator_id
		FROM groups c
		WHERE id = ?
	`
	var admin string
	err := q.Db.QueryRow(query, groupID).Scan(&admin)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", fmt.Errorf("failed to fetch session user: %w", err)
	}
	return admin, nil
}