package repository

import (
	"social/pkg/model"
	"fmt"
)
	


func (q *Query) FetchAllGroups(userid string)([]model.Groups, error) {
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

		groups = append(groups, group)

	}

	
	return groups, nil
}


func (q *Query) checkUserMembershipInGroup(userId string, groupId string, group *model.Groups) bool {

	return false
}

func (q *Query) checkUserRoleInGroup() string {

	return "member"
}
