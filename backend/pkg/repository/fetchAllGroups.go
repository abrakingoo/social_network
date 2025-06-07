package repository

import (
	"fmt"
	"log"
	"social/pkg/model"
	"database/sql"
)

func (q *Query) FetchAllGroups(userid string) ([]model.Groups, error) {
	var groups []model.Groups
	query := `
		SELECT 
			g.id, g.title, g.description, u.id, u.first_name, u.last_name, u.nickname, u.avatar,  
			g.created_at, g.members_count
		FROM groups g
		JOIN users u ON u.id = g.creator_id
	`
	rows, err := q.Db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch groups: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var group model.Groups

		err := rows.Scan(
			&group.ID, &group.Title, &group.About, &group.Creator.ID, &group.Creator.FirstName, &group.Creator.LastName, &group.Creator.Nickname, &group.Creator.Avatar,
			&group.CreatedAt, &group.MembersCount,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan group: %w", err)
		}
		// check for user role in the group if present in the group
		q.CheckUserMembershipInGroup(userid, &group)

		groups = append(groups, group)

	}

	return groups, nil
}

func (q *Query) CheckUserMembershipInGroup(userID string, group *model.Groups) {
	var role string

	query := `SELECT role FROM group_members WHERE user_id = ? AND group_id = ?`
	err := q.Db.QueryRow(query, userID, group.ID).Scan(&role)

	switch {
	case err == sql.ErrNoRows:
		group.IsJoined = false
		group.UserRole = ""
	case err != nil:
		log.Printf("CheckUserMembershipInGroup: db error: %v", err)
		group.IsJoined = false
		group.UserRole = ""
	default:
		group.IsJoined = true
		group.UserRole = role
	}
}
