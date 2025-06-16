package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"social/pkg/model"
)

func (q *Query) FetchFollowers(userID string)([]model.Follower , error) {
	query := `
        SELECT 
            u.id, u.first_name, u.nickname, u.avatar, u.is_public
        FROM user_follows uf
        JOIN users u ON uf.follower_id = u.id
        WHERE uf.following_id = ? AND uf.status = 'accepted'
		ORDER BY uf.created_at ASC
        LIMIT 100
    `
	
	rows, err := q.Db.Query(query, userID)
	if err != nil {
		return nil,  fmt.Errorf("failed to query followers: %w", err)
	}
	defer rows.Close()

	var users []model.Follower
	for rows.Next() {
		var follower model.Follower
		if err := rows.Scan(
			&follower.ID,
			&follower.FirstName,
			&follower.Nickname,
			&follower.Avatar,
			&follower.IsPublic,
		); err != nil {
			return nil, fmt.Errorf("failed to scan follower: %w", err)
		}
		users = append(users, follower)
	}

	return users, nil
}

func (q *Query) FetchFollowing(userID string) ([]model.Follower, error) {
	query := `
        SELECT 
            u.id, u.first_name, u.nickname, u.avatar, u.is_public
        FROM user_follows uf
        JOIN users u ON uf.following_id = u.id
        WHERE uf.follower_id = ? AND uf.status = 'accepted'
		ORDER BY uf.created_at ASC
        LIMIT 100
    `

	rows, err := q.Db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query following: %w", err)
	}
	defer rows.Close()

	var users []model.Follower
	for rows.Next() {
		var following model.Follower
		if err := rows.Scan(
			&following.ID,
			&following.FirstName,
			&following.Nickname,
			&following.Avatar,
			&following.IsPublic,
		); err != nil {
			return nil, fmt.Errorf("failed to scan following: %w", err)
		}
		users = append(users , following)
	}

	return users, nil
}

func (q *Query) FollowExists(followerID, followingID string) (exists bool, status string, err error) {
	query := `
		SELECT status FROM user_follows
		WHERE follower_id = ? AND following_id = ?
		LIMIT 1
	`

	err = q.Db.QueryRow(query, followerID, followingID).Scan(&status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, "", nil // not found
		}
		return false, "", fmt.Errorf("FollowExists: query failed: %w", err)
	}

	return true, status, nil
}
