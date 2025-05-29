package repository

import (
	"database/sql"
	"fmt"
	"social/pkg/model"
	"strings"
)

func (q *Query) GetUserLikedPost(userid string, user *model.UserData) error {
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

	rows, err := q.Db.Query(query, userid)
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

func (q *Query) GetallLikedCommentsPostIDs(userid string) ([]string, error) {
	query := `
	SELECT DISTINCT comment_id
	FROM comment_likes 
	WHERE user_id = ?
	`

	rows, err := q.Db.Query(query, userid)
	if err != nil {
		return nil, fmt.Errorf("failed to query posts: %v", err)
	}
	defer rows.Close()

	var commentIds []string
	for rows.Next() {
		var postID string
		if err := rows.Scan(&postID); err != nil {
			return nil, fmt.Errorf("failed to scan post ID: %v", err)
		}
		commentIds = append(commentIds, postID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error after row iteration: %v", err)
	}

	return commentIds, nil

}

func (q *Query) PostIdsFromCommentsId(commentsid []string) ([]string, error) {
	if len(commentsid) == 0 {
		return []string{}, nil // Early exit if no post IDs provided
	}

	placeholders := strings.Repeat("?,", len(commentsid))
	placeholders = placeholders[:len(placeholders)-1] // Remove trailing comma

	query := `
	SELECT DISTINCT post_id
	FROM comments 
	WHERE comment_id IN (` + placeholders + `)`

	// Convert postIDs ([]string) to []interface{} for Query
	args := make([]interface{}, len(commentsid))
	for i, id := range commentsid {
		args[i] = id
	}

	rows, err := q.Db.Query(query, args...)
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
