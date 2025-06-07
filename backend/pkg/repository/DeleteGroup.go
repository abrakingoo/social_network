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

	// delete group
	
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
