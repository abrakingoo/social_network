package repository

import (
	"fmt"
)

func (q *Query) DeleteGroup(groupName , userid string) error {
	// Check if group exists
	if err := q.CheckIfGroupExist(groupName); err != nil {
		return fmt.Errorf("errGroupNotFound: %w", err)
	}
	
	// check if user is the creator
	if err := q.CheckIfUserIsGroupAdmin(groupName,userid);err != nil {
		return fmt.Errorf("errUnathorized: %w", err)
	}

	// delete group
	if err := q.deleteGroup(groupName); err != nil {
		return err
	}
	
	return nil
}

func (q *Query) CheckIfGroupExist(groupName string) error {
	var exists bool
    query := `SELECT EXISTS(SELECT 1 FROM groups WHERE title = ?)`
    
    err := q.Db.QueryRow(query, groupName).Scan(&exists)
    if err != nil {
        return fmt.Errorf("group does not exist")
    }

    return nil
} 

func (q *Query) CheckIfUserIsGroupAdmin(groupName, userid string) error {
	var admin bool
	query := `SELECT EXISTS(SELECT 1 FROM groups WHERE title = ? AND creator_id = ?)`
	err := q.Db.QueryRow(query, groupName, userid).Scan(&admin)
    if err != nil {
        return fmt.Errorf("user is not the admin")
    }

	return nil
}

func (q *Query) deleteGroup(groupname string) error {
	_, err := q.Db.Exec("DELETE FROM groups WHERE title = ?", groupname)
	if err != nil {
		return err
	}
	return nil
}