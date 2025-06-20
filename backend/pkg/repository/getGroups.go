package repository

func (q *Query) GetUserGroupIDs(userID string) ([]string, error) {
	rows, err := q.Db.Query(`
		SELECT group_id
		FROM group_members
		WHERE user_id = ?
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groupIDs []string
	for rows.Next() {
		var groupID string
		if err := rows.Scan(&groupID); err != nil {
			return nil, err
		}
		groupIDs = append(groupIDs, groupID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return groupIDs, nil
}
