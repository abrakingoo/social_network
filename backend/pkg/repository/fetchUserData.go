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

	//fetch all the user post
	if err:= q.fetchUserPost(userid, &user ); err != nil {
		return model.UserData{}, err
	} 

	postIDs := make([]string, len(user.Post))
    for i, post := range user.Post {
        postIDs[i] = post.ID
    }

    // Fetch comments with their media
    commentsByPost, err := q.FetchCommentsWithMedia(postIDs)
    if err != nil {
        return model.UserData{}, fmt.Errorf("failed to get comments: %w", err)
    }

	//attach comments to user post
	for i := range user.Post {
        user.Post[i].Comments = commentsByPost[user.Post[i].ID]
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
		return errors.New("no user data found")
	}
	if err != nil {
		return err
	}

	return nil
}

func (q *Query) fetchUserPost(userID string, user *model.UserData) error {
	query := `
		SELECT 
			p.id, p.group_id, p.content, 
			p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
			m.id, m.url
		FROM posts p
		LEFT JOIN media m ON m.parent_id = p.id
		WHERE p.user_id = ?
		ORDER BY p.created_at DESC
	`

	rows, err := q.Db.Query(query, userID)
	if err != nil {
		return fmt.Errorf("failed to fetch user posts: %w", err)
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

		if err := rows.Scan(
			&post.ID, &groupID, &post.Content,
			&post.LikesCount, &post.DislikesCount, &post.CommentsCount, &post.Privacy, &post.CreatedAt,
			&mediaID, &mediaURL,
		); err != nil {
			return fmt.Errorf("failed to scan user post: %w", err)
		}

		post.GroupID = ""
		if groupID.Valid {
			post.GroupID = groupID.String
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
