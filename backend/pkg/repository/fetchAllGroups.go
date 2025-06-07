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
		return nil, fmt.Errorf("failed to fetch posts: %w", err)
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
		q.checkUserMembershipInGroup(userid, &group)

		groups = append(groups, group)

	}

	return groups, nil
}

func (q *Query) checkUserMembershipInGroup(userId string, group *model.Groups) {
	var role string
	var is_joined bool

	query := `SELECT role FROM group_members WHERE user_id = ? AND group_id = ?`

	err := q.Db.QueryRow(query, userId, group.ID).Scan(&role)
	if err == sql.ErrNoRows {
		// user does not exist
		is_joined = false
		role = ""
	} else if err != nil {
		// other DB error
		log.Printf("CheckuserMemberShipInGroup: the db error is %v", err)
		return
	} else {
		is_joined = true
	}

	group.IsJoined = is_joined
	group.UserRole = role
}
