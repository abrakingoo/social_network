package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"social/pkg/model"
)

func (q *Query) FetchFollowers(userID string, userData *model.UserData) error {
	query := `
        SELECT 
            u.id, u.first_name, u.last_name, u.nickname, u.avatar
        FROM user_follows uf
        JOIN users u ON uf.follower_id = u.id
        WHERE uf.following_id = ? AND uf.status = 'accepted'
    `

	rows, err := q.Db.Query(query, userID)
	if err != nil {
		return fmt.Errorf("failed to query followers: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var follower model.Follower
		if err := rows.Scan(
			&follower.ID,
			&follower.FirstName,
			&follower.LastName,
			&follower.Nickname,
			&follower.Avatar,
		); err != nil {
			return fmt.Errorf("failed to scan follower: %w", err)
		}
		userData.Followers = append(userData.Followers, follower)
	}

	return rows.Err()
}

func (q *Query) FetchFollowing(userID string, userData *model.UserData) error {
	query := `
        SELECT 
            u.id, u.first_name, u.last_name, u.nickname, u.avatar
        FROM user_follows uf
        JOIN users u ON uf.following_id = u.id
        WHERE uf.follower_id = ? AND uf.status = 'accepted'
    `

	rows, err := q.Db.Query(query, userID)
	if err != nil {
		return fmt.Errorf("failed to query following: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var following model.Follower
		if err := rows.Scan(
			&following.ID,
			&following.FirstName,
			&following.LastName,
			&following.Nickname,
			&following.Avatar,
		); err != nil {
			return fmt.Errorf("failed to scan following: %w", err)
		}
		userData.Following = append(userData.Following, following)
	}

	return rows.Err()
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
