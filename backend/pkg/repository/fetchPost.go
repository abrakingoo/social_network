package repository

import (
	"database/sql"
	"fmt"
	"social/pkg/model"
	"strings"
)

func (q *Query) FetchPostWithMedia() ([]model.Post, error) {
	query := `
			SELECT 
				p.id, p.group_id, p.content, 
				p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
				m.id, m.url
			FROM posts p
			LEFT JOIN media m ON m.parent_id = p.id
			ORDER BY p.created_at DESC
		`
	rows, err := q.Db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch posts: %w", err)
	}
	defer rows.Close()

	var posts []model.Post
	postsMap := make(map[string]*model.Post)

	for rows.Next() {
		var (
			post     model.Post
			mediaID  sql.NullString
			mediaURL sql.NullString
		)

		err := rows.Scan(
			&post.ID, &post.GroupID, &post.Content,
			&post.LikesCount, &post.DislikesCount, &post.CommentsCount, &post.Privacy, &post.CreatedAt,
			&mediaID, &mediaURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
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
			posts = append(posts, post)
		}
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
				c.id, c.post_id, c.group_id, c.content,
				c.likes_count, c.dislikes_count, c.created_at,
				m.id, m.url
			FROM comments c
			LEFT JOIN media m ON m.parent_id = c.id
			WHERE c.post_id IN (%s)
			ORDER BY c.created_at ASC
		`, strings.Join(placeholders, ","))

	rows, err := q.Db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch comments: %w", err)
	}
	defer rows.Close()

	commentsByPost := make(map[string][]model.Comment)
	commentsMap := make(map[string]*model.Comment)

	for rows.Next() {
		var (
			comment  model.Comment
			mediaID  sql.NullString
			mediaURL sql.NullString
		)

		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.GroupID, &comment.Content,
			&comment.LikesCount, &comment.DislikesCount, &comment.CreatedAt,
			&mediaID, &mediaURL,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}

		if existingComment, exists := commentsMap[comment.ID]; exists {
			if mediaID.Valid {
				existingComment.Media = append(existingComment.Media, model.Media{
					URL: mediaURL.String,
				})
			}
		} else {
			if mediaID.Valid {
				comment.Media = []model.Media{{
					URL: mediaURL.String,
				}}
			} else {
				comment.Media = []model.Media{}
			}

			commentsMap[comment.ID] = &comment
			commentsByPost[comment.PostID] = append(commentsByPost[comment.PostID], comment)
		}
	}

	return commentsByPost, nil
}


func (q *Query) FetchAllPosts() ([]model.Post, error) {
    // 1. Fetch posts with their media
    posts, err := q.FetchPostWithMedia()
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