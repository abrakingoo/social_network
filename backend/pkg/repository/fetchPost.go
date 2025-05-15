package repository

import (
	"social/pkg/model"
	"fmt"
	"database/sql"
)

func (q *Query) FetchAllPost() ([]model.Post, error) {
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
				post model.Post
				mediaID sql.NullString
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
						URL:  mediaURL.String,
					})
				}
			} else {
				if mediaID.Valid {
					post.Media = []model.Media{{
						URL:  mediaURL.String,
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