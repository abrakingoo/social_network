package repository

import (
	"database/sql"
	"fmt"
)

func (q *Query) CheckUserIsPublic(userID string) (bool, error) {
	var isPublic bool
	err := q.Db.QueryRow("SELECT is_public FROM users WHERE id = ?", userID).Scan(&isPublic)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, fmt.Errorf("CheckUserIsPublic: User not found")
		}
		return false, fmt.Errorf("CheckUserIsPublic: Query error: %w", err)
	}

	return isPublic, nil

}
