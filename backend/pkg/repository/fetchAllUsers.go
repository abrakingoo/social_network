package repository

import(
	"social/pkg/model"
	"fmt"
	"log"
) 


func (q *Query) FetchAllUsers() ([]model.User ,error) {
	var users []model.User
	
	query := `
		SELECT 
			u.id, u.first_name, u.last_name, u.nickname, u.avatar,  
			u.is_public
		FROM users u
		ORDER BY u.created_at DESC
        LIMIT 100
	`
	rows, err := q.Db.Query(query)
	if err != nil {
		log.Printf("FetchAllUsers: db error: %v", err)
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}

	defer rows.Close()

	for rows.Next() {
		var user model.User

		err := rows.Scan(
			&user.ID, &user.FirstName, &user.LastName, &user.Nickname, 
			&user.Avatar, &user.IsPublic,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan group: %w", err)
		}

		users = append(users, user)

	}

	return users, nil

}