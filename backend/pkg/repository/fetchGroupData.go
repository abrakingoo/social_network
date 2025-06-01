package repository

import (
	"database/sql"
	"errors"
	"social/pkg/model"
)

func (q *Query) FetchGroupData(groupid string) (model.GroupData, error) {
	var group model.GroupData

	// fetch available group info
	if err := q.fetchGroupInfo(groupid, &group); err != nil {
		return model.GroupData{}, err
	}
	// fetch all group members
	if err := q.fetchGroupMembers(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	// fetch all group events information
	if err := q.fetchGroupEvents(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	return group, nil
}

func (q *Query) fetchGroupInfo(groupid string, group *model.GroupData) error {
	row := q.Db.QueryRow(`
        SELECT g.id, g.title, g.description, 
		g.created_at, u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM groups g
		JOIN users u ON u.id = g.creator_id
        WHERE g.id = ? 
    `, groupid)

	var user = model.Creator{}

	err := row.Scan(&group.ID, &group.Title, &group.About, &group.CreatedAt, &user.ID, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar)
	if err == sql.ErrNoRows {
		return errors.New("no group data found")
	}
	if err != nil {
		return err
	}

	group.Creator = user
	return nil

}

func (q *Query) fetchGroupMembers(groupid string, group *model.GroupData) error {
	rows, err := q.Db.Query(`
		SELECT 
			u.id, u.first_name, u.last_name, u.nickname, u.avatar, gm.role
		FROM group_members gm
		JOIN users u ON u.id = gm.user_id
		WHERE gm.group_id = ?
	`, groupid)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var member model.Creator

		err := rows.Scan(
			&member.ID, &member.FirstName, &member.LastName, &member.Nickname,
			&member.Avatar, &member.Role)
		if err != nil {
			return err
		}

		group.Members = append(group.Members, member)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	return nil
}

func (q *Query) fetchGroupEvents(groupid string, group *model.GroupData) error {

	return nil
}
