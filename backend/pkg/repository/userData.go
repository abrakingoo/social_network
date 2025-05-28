package repository

import (
	"database/sql"
	"fmt"
)

// GetUserData retrieves user data by ID
func (q *Query) GetUserData(userID string) (map[string]interface{}, error) {
	query := `
		SELECT
			id, email, first_name, last_name,
			date_of_birth, avatar, nickname,
			about_me, is_public, created_at
		FROM users
		WHERE id = ?
	`

	var user struct {
		ID          string
		Email       string
		FirstName   string
		LastName    string
		DateOfBirth string
		Avatar      sql.NullString
		Nickname    sql.NullString
		AboutMe     sql.NullString
		IsPublic    bool
		CreatedAt   string
	}

	err := q.Db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Nickname,
		&user.AboutMe,
		&user.IsPublic,
		&user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to fetch user data: %w", err)
	}

	return map[string]interface{}{
		"id":           user.ID,
		"email":        user.Email,
		"firstName":    user.FirstName,
		"lastName":     user.LastName,
		"dateOfBirth":  user.DateOfBirth,
		"avatar":       user.Avatar.String,
		"nickname":     user.Nickname.String,
		"about":        user.AboutMe.String,
		"isPublic":     user.IsPublic,
		"createdAt":    user.CreatedAt,
	}, nil
}

// GetAllUsers retrieves all public users
func (q *Query) GetAllUsers() ([]map[string]interface{}, error) {
	query := `
		SELECT
			id, email, first_name, last_name,
			date_of_birth, avatar, nickname,
			about_me, is_public, created_at
		FROM users
		WHERE is_public = true
	`

	rows, err := q.Db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var user struct {
			ID          string
			Email       string
			FirstName   string
			LastName    string
			DateOfBirth string
			Avatar      sql.NullString
			Nickname    sql.NullString
			AboutMe     sql.NullString
			IsPublic    bool
			CreatedAt   string
		}

		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.FirstName,
			&user.LastName,
			&user.DateOfBirth,
			&user.Avatar,
			&user.Nickname,
			&user.AboutMe,
			&user.IsPublic,
			&user.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to process user data: %w", err)
		}

		users = append(users, map[string]interface{}{
			"id":           user.ID,
			"email":        user.Email,
			"firstName":    user.FirstName,
			"lastName":     user.LastName,
			"dateOfBirth":  user.DateOfBirth,
			"avatar":       user.Avatar.String,
			"nickname":     user.Nickname.String,
			"about":        user.AboutMe.String,
			"isPublic":     user.IsPublic,
			"createdAt":    user.CreatedAt,
		})
	}

	return users, nil
}