package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"social/pkg/model"
)

func (q *Query) FetchPostWithMedia(id string) ([]model.Post, error) {
	query := `
		SELECT 
			p.id, p.content, 
			p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
			m.id, m.url, u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM posts p
		LEFT JOIN media m ON m.parent_id = p.id
		LEFT JOIN users u ON u.id = p.user_id
		WHERE p.group_id IS NULL
		 AND (
    	-- Public posts: everyone can see
    		p.privacy = 'public'
    	OR
    	-- Almost private: only accepted followers can see
    		(p.privacy = 'almost_private' AND EXISTS (
      		SELECT 1 FROM user_follows uf 
      		WHERE uf.following_id = p.user_id 
        	AND uf.follower_id = ?            -- current user ID parameter
        	AND uf.status = 'accepted'
    		))
    	OR
    	-- Private: only users in visibility list can see
    		(p.privacy = 'private' AND EXISTS (
      		SELECT 1 FROM post_visibility pv 
      		WHERE pv.post_id = p.id 
       		AND pv.user_id = ?                -- current user ID parameter
    	))
    	OR
    	-- User's own posts: always visible
    		p.user_id = ?                     -- current user ID parameter
  		)
		ORDER BY p.created_at DESC
	`
	rows, err := q.Db.Query(query, id, id, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch posts: %w", err)
	}
	defer rows.Close()

	postsMap := make(map[string]*model.Post)

	for rows.Next() {
		var (
			postID        string
			content       string
			likesCount    int
			dislikesCount int
			commentsCount int
			privacy       string
			createdAt     time.Time
			mediaID       sql.NullString
			mediaURL      sql.NullString
			userID        sql.NullString
			firstname     sql.NullString
			lastname      sql.NullString
			nickname      sql.NullString
			avatar        sql.NullString
		)

		err := rows.Scan(
			&postID, &content,
			&likesCount, &dislikesCount, &commentsCount, &privacy, &createdAt,
			&mediaID, &mediaURL, &userID, &firstname, &lastname, &nickname, &avatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}

		// Get or create the post
		post, exists := postsMap[postID]
		if !exists {
			user := &model.Creator{}
			if userID.Valid {
				user.ID = userID.String
				user.FirstName = firstname.String
				user.LastName = lastname.String
				user.Nickname = nickname.String
				user.Avatar = avatar.String
			}

			post = &model.Post{
				ID:            postID,
				User:          *user,
				GroupID:       "",
				Content:       content,
				LikesCount:    likesCount,
				DislikesCount: dislikesCount,
				CommentsCount: commentsCount,
				Privacy:       privacy,
				CreatedAt:     createdAt,
				Media:         []model.Media{},
			}
			postsMap[postID] = post
		}

		if mediaID.Valid && mediaURL.Valid {
			post.Media = append(post.Media, model.Media{
				URL: mediaURL.String,
			})
		}
	}

	// Convert map to slice
	var posts []model.Post
	for _, post := range postsMap {
		posts = append(posts, *post)
	}

	return posts, nil
}

func (q *Query) FetchCommentsWithMedia(postIDs []string) (map[string][]model.Comment, error) {
	if len(postIDs) == 0 {
		return make(map[string][]model.Comment), nil
	}

	placeholders := make([]string, len(postIDs))
	args := make([]interface{}, len(postIDs))
	for i, id := range postIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
			SELECT 
				c.id, c.post_id, c.content,
				c.likes_count, c.dislikes_count, c.created_at,
				m.id, m.url, u.id, u.first_name, u.last_name, u.nickname, u.avatar
			FROM comments c
			LEFT JOIN media m ON m.parent_id = c.id
			LEFT JOIN users u ON u.id = c.user_id
			WHERE c.post_id IN (%s)
			ORDER BY c.created_at ASC
		`, strings.Join(placeholders, ","))

	rows, err := q.Db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch comments: %w", err)
	}
	defer rows.Close()

	commentsPostMap := make(map[string]string)
	commentsMap := make(map[string]*model.Comment)

	for rows.Next() {
		var (
			comment   model.Comment
			mediaID   sql.NullString
			mediaURL  sql.NullString
			userID    sql.NullString
			firstname sql.NullString
			lastname  sql.NullString
			nickname  sql.NullString
			avatar    sql.NullString
		)

		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.Content,
			&comment.LikesCount, &comment.DislikesCount, &comment.CreatedAt,
			&mediaID, &mediaURL, &userID, &firstname, &lastname, &nickname, &avatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}
		user := model.Creator{}
		if userID.Valid {
			user.ID = userID.String
			user.FirstName = firstname.String
			user.LastName = lastname.String
			user.Nickname = nickname.String
			user.Avatar = avatar.String
		}

		comment.User = user
		// store the post id for this comment
		commentsPostMap[comment.ID] = comment.PostID

		if existingComment, exists := commentsMap[comment.ID]; exists {
			if mediaID.Valid {
				existingComment.Media = append(existingComment.Media, model.Media{
					URL: mediaURL.String,
				})
			}
		} else {
			comment.Media = []model.Media{}
			if mediaID.Valid {
				comment.Media = append(comment.Media, model.Media{
					URL: mediaURL.String,
				})
			}

			commentsMap[comment.ID] = &comment
		}
	}

	commentsByPost := make(map[string][]model.Comment)
	for commentID, comment := range commentsMap {
		postID := commentsPostMap[commentID]
		commentsByPost[postID] = append(commentsByPost[postID], *comment)
	}

	return commentsByPost, nil
}

func (q *Query) FetchAllPosts(userID string) ([]model.Post, error) {
	// 1. Fetch posts with their media
	posts, err := q.FetchPostWithMedia(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}

	// 2. Get post IDs for comment fetching
	postIDs := make([]string, len(posts))
	for i, post := range posts {
		postIDs[i] = post.ID
	}

	// 3. Fetch comments with their media
	commentsByPost, err := q.FetchCommentsWithMedia(postIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}

	// 4. Attach comments to posts
	for i := range posts {
		posts[i].Comments = commentsByPost[posts[i].ID]
	}

	return posts, nil
}
