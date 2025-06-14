package repository

import (
	"fmt"
	"log"
	"social/pkg/model"
)

func (q *Query) FetchAllUsers(userID string) ([]model.User, error) {

	return nil , nil
}

func (q *Query) fetchNonMutual(userID string, allUsers *model.AllUsers) error {

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
		return fmt.Errorf("failed to fetch non mutuL users: %w", err)
	}

	defer rows.Close()

	for rows.Next() {
		var user model.Follower

		err := rows.Scan(
			&user.ID, &user.FirstName, &user.Nickname,
			&user.Avatar, &user.IsPublic,
		)

		if err != nil {
			return fmt.Errorf("failed to scan user: %w", err)
		}

		users = append(users, user)

	}

	allUsers.NonMutual = users

	return nil
}
