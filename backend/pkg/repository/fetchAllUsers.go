package repository

import (
	"fmt"
	"log"
	"social/pkg/model"
)

func (q *Query) FetchAllUsers(userID string) ([]model.AllUsers, error) {

	var _ model.AllUsers

	// return folllowers 

	// return following


	return nil , nil
}

func (q *Query) FetchNonMutual(userID string) ([]model.Follower, error) {

	var users []model.Follower
	query := `
		SELECT 
			u.id, u.first_name, u.last_name, u.nickname, u.avatar,  
			u.is_public
		FROM users u
		WHERE u.id != ? 
		AND NOT EXISTS (
      		SELECT 1
     			FROM user_follows uf
      			WHERE 
        		(uf.follower_id = u.id AND uf.following_id = ?) OR
        		(uf.follower_id = ? AND uf.following_id = u.id)
 		)
		ORDER BY u.created_at DESC
        LIMIT 100
	`
	rows, err := q.Db.Query(query, userID)
	if err != nil {
		log.Printf("FetchAllUsers: db error: %v", err)
		return nil, fmt.Errorf("failed to fetch non mutuL users: %w", err)
	}

	defer rows.Close()

	for rows.Next() {
		var user model.Follower

		err := rows.Scan(
			&user.ID, &user.FirstName, &user.Nickname,
			&user.Avatar, &user.IsPublic,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		users = append(users, user)

	}

	return users, nil
}


func (q *Query) FetchSentFollowRequests(userID string) ([]model.Follower, error) {

	return nil, nil
}

func (q *Query) FetchReceivedFollowRequests(userId string) ([]model.Follower, error) {

	return nil, nil
} 