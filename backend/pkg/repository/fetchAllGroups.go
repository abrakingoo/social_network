package repository

import (
	"database/sql"
	"fmt"
	"log"
	"social/pkg/model"
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
		log.Printf("FetchAllGroups: db error: %v", err)
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

		// Always fetch the current user's join request (if any)
		if userid != "" {
			row := q.Db.QueryRow(`
				SELECT gjr.id, gjr.user_id, gjr.created_at, gjr.status, u.id, u.first_name, u.last_name, u.nickname, u.avatar
				FROM group_join_requests gjr
				JOIN users u ON gjr.user_id = u.id
				WHERE gjr.group_id = ? AND gjr.user_id = ?
				ORDER BY gjr.created_at DESC LIMIT 1
			`, group.ID, userid)
			var req model.GroupJoinRequest
			err := row.Scan(
				&req.ID,
				&req.UserID,
				&req.CreatedAt,
				&req.Status,
				&req.User.ID,
				&req.User.Firstname,
				&req.User.Lastname,
				&req.User.Nickname,
				&req.User.Avatar,
			)
			if err == nil {
				group.UserJoinRequest = &req
			}
		}

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
