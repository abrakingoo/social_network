package repository

import (
	"errors"
	"fmt"
)

var (
	ErrGroupNotFound = errors.New("group not found")
	ErrUnauthorized  = errors.New("user not authorized")
)

func (q *Query) DeleteGroup(groupName, userId string) error {
	// Check if group exists
	if err := q.CheckIfGroupExist(groupName); err != nil {
		return err
	}

	// check if user is the creator
	if err := q.CheckIfUserIsGroupAdmin(groupName, userId); err != nil {
		return err
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
		return fmt.Errorf("database error: %v", err)
	}

	if !exists {
		return ErrGroupNotFound
	}

	return nil
}

func (q *Query) CheckIfUserIsGroupAdmin(groupName, userId string) error {
	var admin bool
	query := `SELECT EXISTS(SELECT 1 FROM groups WHERE title = ? AND creator_id = ?)`
	err := q.Db.QueryRow(query, groupName, userId).Scan(&admin)
	if err != nil {
		return fmt.Errorf("database err: %v", err)
	}

	if !admin {
		return ErrUnauthorized
	}

	return nil
}

func (q *Query) deleteGroup(groupName string) error {
	_, err := q.Db.Exec("DELETE FROM groups WHERE title = ?", groupName)
	if err != nil {
		return err
	}
	return nil
}
