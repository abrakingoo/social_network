package repository

import (
	"database/sql"
	"errors"
	"social/pkg/model"
	"fmt"
)

func (q *Query) FetchUserData(userid string) (model.UserData, error) {
	var user model.UserData

	// fetch the user data first
	if err := q.fetchUserInfo(userid, &user); err != nil {
		return model.UserData{}, err
	}

	return user, nil
}

// fetchUserInfo first fetches userinfo from the user info table
func (q *Query) fetchUserInfo(userid string, user *model.UserData) error {
	row := q.Db.QueryRow(`
        SELECT email, first_name, last_name, 
		date_of_birth, avatar, nickname , about_me , 
		is_public 
        FROM users 
        WHERE id = ? 
        LIMIT 1
    `, userid)

	err := row.Scan(&user.Email, &user.FirstName, &user.LastName, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe)
	if err == sql.ErrNoRows {
		return errors.New("user not found by email or nickname")
	}
	if err != nil {
		return err
	}

	return nil
}

func (q *Query) fetchUserPost(userid string, user *model.UserData) error {
	query := `
				SELECT 
					p.id, p.group_id, p.content, 
					p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
					m.id, m.url
				FROM posts p WHERE p.id = ?
				LEFT JOIN media m ON m.parent_id = p.id
				ORDER BY p.created_at DESC
			`
	rows, err := q.Db.Query(query)
	if err != nil {
		return fmt.Errorf("failed to fetch posts: %w", err)
	}
	defer rows.Close()

	postsMap := make(map[string]*model.Post)

	for rows.Next() {
		var (
			post     model.Post
			groupID  sql.NullString
			mediaID  sql.NullString
			mediaURL sql.NullString
		)

		err := rows.Scan(
			&post.ID, &groupID, &post.Content,
			&post.LikesCount, &post.DislikesCount, &post.CommentsCount, &post.Privacy, &post.CreatedAt,
			&mediaID, &mediaURL,
		)
		if err != nil {
			fmt.Errorf("failed to scan post: %w", err)
		}

		//if the post has a group id we assign it, else we put an empty string
		if groupID.Valid {
			post.GroupID = groupID.String
		} else {
			post.GroupID = ""
		}

		if existingPost, exists := postsMap[post.ID]; exists {
			if mediaID.Valid {
				existingPost.Media = append(existingPost.Media, model.Media{
					URL: mediaURL.String,
				})
			}
		} else {
			if mediaID.Valid {
				post.Media = []model.Media{{
					URL: mediaURL.String,
				}}
			} else {
				post.Media = []model.Media{}
			}
			post.Comments = []model.Comment{}
			postsMap[post.ID] = &post
			user.Post = append(user.Post, post)
		}
	}

	return nil
}
