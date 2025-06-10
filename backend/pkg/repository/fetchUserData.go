package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"social/pkg/model"
)

func (q *Query) FetchUserData(userid string) (model.UserData, error) {
	var user model.UserData

	// fetch the user data first
	if err := q.fetchUserInfo(userid, &user); err != nil {
		return model.UserData{}, err
	}

	// fetch all user created post
	if err := q.FetchUserPost(userid, &user); err != nil {
		return model.UserData{}, err
	}

	// fetch all user created comments
	if err := q.FetchUserComments(userid, &user); err != nil {
		return model.UserData{}, err
	}

	// fetch liked post by the user
	if err := q.FetchLikedPost(userid, &user); err != nil {
		return model.UserData{}, err
	}

	// fetch liked comments (the whole post) by the user
	if err := q.FetchLikedComments(userid, &user); err != nil {
		return model.UserData{}, err
	}

	// handle all followers logic
	if err := q.GetFollowers(userid, &user); err != nil {
		return model.UserData{}, err
	}

	return user, nil
}

func (q *Query) FetchUserPost(userid string, user *model.UserData) error {
	if err := q.fetchUserPost(userid, user); err != nil {
		return err
	}

	postIDs := make([]string, len(user.Post))
	for i, post := range user.Post {
		postIDs[i] = post.ID
	}

	// Fetch comments with their media
	commentsByPost, err := q.FetchCommentsWithMedia(postIDs)
	if err != nil {
		return fmt.Errorf("failed to get comments: %w", err)
	}

	// attach comments to user post
	for i := range user.Post {
		user.Post[i].Comments = commentsByPost[user.Post[i].ID]
	}

	return nil
}

func (q *Query) FetchUserComments(userid string, user *model.UserData) error {
	postIDs, err := q.getAllCommentedPostID(userid)
	if err != nil {
		return err
	}

	// use all the ids to fetch the post
	if user.Comments, err = q.fetchPostsByIDs(postIDs); err != nil {
		return err
	}

	// get all the post ids to fetch the comments( might refactor)
	postIDs = make([]string, len(user.Comments))
	for i, post := range user.Comments {
		postIDs[i] = post.ID
	}

	// Fetch comments with their media
	commentsByPost, err := q.FetchCommentsWithMedia(postIDs)
	if err != nil {
		return fmt.Errorf("failed to get comments: %w", err)
	}

	// attach comments to user post
	for i := range user.Comments {
		user.Comments[i].Comments = commentsByPost[user.Comments[i].ID]
	}

	return nil
}

// fetchUserInfo first fetches userinfo from the user info table
func (q *Query) fetchUserInfo(userid string, user *model.UserData) error {
	row := q.Db.QueryRow(`
        SELECT id, email, first_name, last_name,
		date_of_birth, avatar, nickname , about_me, created_at ,
		is_public
        FROM users
        WHERE id = ?
        LIMIT 1
    `, userid)

	err := row.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.DateOfBirth, &user.Avatar, &user.Nickname, &user.AboutMe, &user.CreatedAt, &user.IsPublic)
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
			m.id, m.url, u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM posts p
		LEFT JOIN media m ON m.parent_id = p.id
		LEFT JOIN users u ON u.id = p.user_id
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
			post      model.Post
			groupID   sql.NullString
			mediaID   sql.NullString
			mediaURL  sql.NullString
			userID    sql.NullString
			firstname sql.NullString
			lastname  sql.NullString
			nickname  sql.NullString
			avatar    sql.NullString
		)

		if err := rows.Scan(
			&post.ID, &groupID, &post.Content,
			&post.LikesCount, &post.DislikesCount, &post.CommentsCount, &post.Privacy, &post.CreatedAt,
			&mediaID, &mediaURL, &userID, &firstname, &lastname, &nickname, &avatar,
		); err != nil {
			return fmt.Errorf("failed to scan user post: %w", err)
		}

		post.GroupID = ""
		if groupID.Valid {
			post.GroupID = groupID.String
		}

		creator := &model.Creator{}
		if userID.Valid {
			creator.ID = userID.String
			creator.FirstName = firstname.String
			creator.LastName = lastname.String
			creator.Nickname = nickname.String
			creator.Avatar = avatar.String
		}

		post.User = *creator

		if existingPost, exists := postsMap[post.ID]; exists {
			if mediaID.Valid {
				existingPost.Media = append(existingPost.Media, model.Media{
					URL: mediaURL.String,
				})
			}
		} else {
			post.Media = []model.Media{}
			if mediaID.Valid {
				post.Media = append(post.Media, model.Media{
					URL: mediaURL.String,
				})
			}
			postsMap[post.ID] = &post
		}
	}
	user.Post = make([]model.Post, 0, len(postsMap))
	for _, post := range postsMap {
		user.Post = append(user.Post, *post)
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

func (q *Query) fetchPostsByIDs(postIDs []string) ([]model.Post, error) {
	if len(postIDs) == 0 {
		return []model.Post{}, nil // Early exit if no post IDs provided
	}

	placeholders := strings.Repeat("?,", len(postIDs))
	placeholders = placeholders[:len(placeholders)-1] // Remove trailing comma

	query := `
        SELECT
            p.id, p.group_id, p.content,
            p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
            m.id, m.url, u.id, u.first_name, u.last_name, u.nickname, u.avatar
        FROM posts p
        LEFT JOIN media m ON m.parent_id = p.id
		LEFT JOIN users u ON u.id = p.user_id
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
		return []model.Post{}, fmt.Errorf("failed to fetch posts {user commented post} by IDs: %w", err)
	}
	defer rows.Close()

	postsMap := make(map[string]*model.Post)
	var Posts []model.Post
	for rows.Next() {
		var (
			post      model.Post
			groupID   sql.NullString
			mediaID   sql.NullString
			mediaURL  sql.NullString
			userID    sql.NullString
			firstname sql.NullString
			lastname  sql.NullString
			nickname  sql.NullString
			avatar    sql.NullString
		)

		if err := rows.Scan(
			&post.ID, &groupID, &post.Content,
			&post.LikesCount, &post.DislikesCount, &post.CommentsCount, &post.Privacy, &post.CreatedAt,
			&mediaID, &mediaURL, &userID, &firstname, &lastname, &nickname, &avatar,
		); err != nil {
			return []model.Post{}, fmt.Errorf("failed to scan post: %w", err)
		}

		// Handle NULL group_id
		if groupID.Valid {
			post.GroupID = groupID.String
		} else {
			post.GroupID = ""
		}

		creator := &model.Creator{}
		if userID.Valid {
			creator.ID = userID.String
			creator.FirstName = firstname.String
			creator.LastName = lastname.String
			creator.Nickname = nickname.String
			creator.Avatar = avatar.String
		}

		post.User = *creator
		// Check if post already exists in the map (due to LEFT JOIN media)
		if existingPost, exists := postsMap[post.ID]; exists {
			// Append media if it exists
			if mediaID.Valid {
				existingPost.Media = append(existingPost.Media, model.Media{
					URL: mediaURL.String,
				})
			}
		} else {
			post.Media = []model.Media{}
			if mediaID.Valid {
				post.Media = append(post.Media, model.Media{
					URL: mediaURL.String,
				})
			}
			postsMap[post.ID] = &post
		}
	}

	for _, post := range postsMap {
		Posts = append(Posts, *post)
	}

	return Posts, nil
}

func (q *Query) FetchLikedPost(userid string, user *model.UserData) error {
	// get all the post where the user has commented
	postIDs, err := q.getallLikedPostIDs(userid)
	if err != nil {
		return err
	}

	// use all the ids to fetch the post
	if user.LikedPost, err = q.fetchPostsByIDs(postIDs); err != nil {
		return err
	}

	// get all the post ids to fetch the comments( might refactor)
	postIDs = make([]string, len(user.LikedPost))
	for i, post := range user.LikedPost {
		postIDs[i] = post.ID
	}

	// Fetch comments with their media
	commentsByPost, err := q.FetchCommentsWithMedia(postIDs)
	if err != nil {
		return fmt.Errorf("failed to get comments: %w", err)
	}

	// attach comments to user post
	for i := range user.LikedPost {
		user.LikedPost[i].Comments = commentsByPost[user.LikedPost[i].ID]
	}

	return nil
}

func (q *Query) getallLikedPostIDs(userid string) ([]string, error) {
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

func (q *Query) FetchLikedComments(userid string, user *model.UserData) error {
	// get all the comment ids
	commentIDs, err := q.GetallLikedCommentsPostIDs(userid)
	if err != nil {
		return err
	}

	postIDs, err := q.PostIdsFromCommentsId(commentIDs)
	if err != nil {
		return err
	}

	// use all the ids to fetch the post
	if user.LikedComments, err = q.fetchPostsByIDs(postIDs); err != nil {
		return err
	}

	// get all the post ids to fetch the comments( might refactor)
	postIDs = make([]string, len(user.LikedComments))
	for i, post := range user.LikedComments {
		postIDs[i] = post.ID
	}

	// Fetch comments with their media
	commentsByPost, err := q.FetchCommentsWithMedia(postIDs)
	if err != nil {
		return fmt.Errorf("failed to get comments: %w", err)
	}

	// attach comments to user post
	for i := range user.LikedComments {
		user.LikedComments[i].Comments = commentsByPost[user.LikedComments[i].ID]
	}

	return nil
}

func (q *Query) GetFollowers(userid string, user *model.UserData) error {
	// Fetch followers (people who follow the current user)
	err := q.FetchFollowers(userid, user)
	if err != nil {
		return fmt.Errorf("failed to fetch followers: %w", err)
	}

	// Fetch following (people the current user follows)
	err = q.FetchFollowing(userid, user)
	if err != nil {
		return fmt.Errorf("failed to fetch following: %w", err)
	}

	return nil
}
