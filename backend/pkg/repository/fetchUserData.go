package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"social/pkg/model"
	"strings"
)

func (q *Query) FetchUserData(userid string) (model.UserData, error) {
	var user model.UserData

	// fetch the user data first
	if err := q.fetchUserInfo(userid, &user); err != nil {
		return model.UserData{}, err
	}

	//fetch all the user post
	if err := q.fetchUserPost(userid, &user); err != nil {
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

	//fetch all the user comments
	//the section below sorts the post where the user has commented

	//get all the post where the user has commented
	postIDs, err = q.getAllCommentedPostID(userid)
	if err != nil {
		return model.UserData{}, err
	}

	//use all the ids to fetch the post
	if err = q.fetchPostsByIDs(postIDs, &user); err != nil {
		return model.UserData{}, err
	}

	//get all the post ids to fetch the comments( might refactor)
	postIDs = make([]string, len(user.Comments))
	for i, post := range user.Comments {
		postIDs[i] = post.ID
	}

	// Fetch comments with their media
	commentsByPost, err = q.FetchCommentsWithMedia(postIDs)
	if err != nil {
		return model.UserData{}, fmt.Errorf("failed to get comments: %w", err)
	}

	//attach comments to user post
	for i := range user.Comments {
		user.Comments[i].Comments = commentsByPost[user.Comments[i].ID]
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

func (q *Query) getAllCommentedPostID(userid string) ([]string, error) {
	query := `
		SELECT DISTINCT post_id 
		FROM comments 
		WHERE user_id = ?
	`

	rows, err := q.Db.Query(query, userid)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts: %v", err)
	}
	defer rows.Close()

	var postIDs []string
	for rows.Next() {
		var postID string
		if err := rows.Scan(&postID); err != nil {
			return nil, fmt.Errorf("failed to scan post ID: %v", err)
		}
		postIDs = append(postIDs, postID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after row iteration: %v", err)
	}

	return postIDs, nil
}

func (q *Query) fetchPostsByIDs(postIDs []string, user *model.UserData) error {
	if len(postIDs) == 0 {
		return nil // Early exit if no post IDs provided
	}

	placeholders := strings.Repeat("?,", len(postIDs))
	placeholders = placeholders[:len(placeholders)-1] // Remove trailing comma

	query := `
        SELECT 
            p.id, p.group_id, p.content, 
            p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
            m.id, m.url
        FROM posts p
        LEFT JOIN media m ON m.parent_id = p.id
        WHERE p.id IN (` + placeholders + `)
        ORDER BY p.created_at DESC
    `

	// Convert postIDs ([]string) to []interface{} for Query
	args := make([]interface{}, len(postIDs))
	for i, id := range postIDs {
		args[i] = id
	}

	rows, err := q.Db.Query(query, args...)
	if err != nil {
		return fmt.Errorf("failed to fetch posts {user commented post} by IDs: %w", err)
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
			return fmt.Errorf("failed to scan post: %w", err)
		}

		// Handle NULL group_id
		if groupID.Valid {
			post.GroupID = groupID.String
		} else {
			post.GroupID = ""
		}

		// Check if post already exists in the map (due to LEFT JOIN media)
		if existingPost, exists := postsMap[post.ID]; exists {
			// Append media if it exists
			if mediaID.Valid {
				existingPost.Media = append(existingPost.Media, model.Media{
					URL: mediaURL.String,
				})
			}
		} else {
			// Initialize post media (if exists)
			if mediaID.Valid {
				post.Media = []model.Media{{
					URL: mediaURL.String,
				}}
			} else {
				post.Media = []model.Media{}
			}
			post.Comments = []model.Comment{} // Initialize empty comments
			postsMap[post.ID] = &post
			user.Comments = append(user.Comments, post)
		}
	}

	return nil
}

func (q *Query) GetallLikedPostIDs(userid string) ([]string, error) {

	query := `
	SELECT DISTINCT post_id 
	FROM post_likes 
	WHERE user_id = ?
`

	rows, err := q.Db.Query(query, userid)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts: %v", err)
	}
	defer rows.Close()

	var postIDs []string
	for rows.Next() {
		var postID string
		if err := rows.Scan(&postID); err != nil {
			return nil, fmt.Errorf("failed to scan post ID: %v", err)
		}
		postIDs = append(postIDs, postID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after row iteration: %v", err)
	}

	return postIDs, nil
}

func (q *Query) GetallLikedCommentsPostIDs(userid string) ([]string, error) {
	query := `
	SELECT DISTINCT post_id 
	FROM comment_likes 
	WHERE user_id = ?
	`

	rows, err := q.Db.Query(query, userid)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts: %v", err)
	}
	defer rows.Close()

	var postIDs []string
	for rows.Next() {
		var postID string
		if err := rows.Scan(&postID); err != nil {
			return nil, fmt.Errorf("failed to scan post ID: %v", err)
		}
		postIDs = append(postIDs, postID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after row iteration: %v", err)
	}

	return postIDs, nil

}

func (q *Query) FetchFollowers(userid string, user *model.UserData) error {
	// Fetch followers (people who follow the current user)
	err := q.fetchFollowers(userid, user)
	if err != nil {
		return fmt.Errorf("failed to fetch followers: %w", err)
	}

	// Fetch following (people the current user follows)
	err = q.fetchFollowing(userid, user)
	if err != nil {
		return fmt.Errorf("failed to fetch following: %w", err)
	}

	return nil
}

func (q *Query) fetchFollowers(userID string, userData *model.UserData) error {
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

func (q *Query) fetchFollowing(userID string, userData *model.UserData) error {
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
