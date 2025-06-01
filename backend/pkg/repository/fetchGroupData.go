package repository

import (
	"database/sql"
	"errors"
	"social/pkg/model"
	"fmt"
	"time"
)

func (q *Query) FetchGroupData(groupid string) (model.GroupData, error) {
	var group model.GroupData
	var err error

	// fetch available group info
	if err := q.fetchGroupInfo(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	// fetch group post
	group.Posts, err = q.fetchGroupPosts(groupid); 
	if err != nil {
		return model.GroupData{}, err
	}

	// fetch all group members
	if err := q.fetchGroupMembers(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	// fetch all group events information
	if err := q.fetchGroupEvents(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	return group, nil
}

func (q *Query) fetchGroupInfo(groupid string, group *model.GroupData) error {
	row := q.Db.QueryRow(`
        SELECT g.id, g.title, g.description, 
		g.created_at, u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM groups g
		JOIN users u ON u.id = g.creator_id
        WHERE g.id = ? 
    `, groupid)

	var user = model.Creator{}

	err := row.Scan(&group.ID, &group.Title, &group.About, &group.CreatedAt, &user.ID, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar)
	if err == sql.ErrNoRows {
		return errors.New("no group data found")
	}
	if err != nil {
		return err
	}

	group.Creator = user
	return nil

}

func (q *Query) fetchGroupPosts(groupid string) ([]model.Post, error) {
	// 1. Fetch posts with their media
	posts, err := q.FetchGroupPostWithMedia(groupid)
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

func (q *Query) FetchGroupPostWithMedia(groupid string) ([]model.Post, error) {
	query := `
		SELECT 
			p.id, p.content, 
			p.likes_count, p.dislikes_count, p.comments_count, p.privacy, p.created_at,
			m.id, m.url, u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM posts p
		LEFT JOIN media m ON m.parent_id = p.id
		LEFT JOIN users u ON u.id = p.user_id
		WHERE p.group_id = ?
		ORDER BY p.created_at DESC
	`
	rows, err := q.Db.Query(query, groupid)
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


func (q *Query) fetchGroupMembers(groupid string, group *model.GroupData) error {
	rows, err := q.Db.Query(`
		SELECT 
			u.id, u.first_name, u.last_name, u.nickname, u.avatar, gm.role
		FROM group_members gm
		JOIN users u ON u.id = gm.user_id
		WHERE gm.group_id = ?
	`, groupid)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var member model.Creator

		err := rows.Scan(
			&member.ID, &member.FirstName, &member.LastName, &member.Nickname,
			&member.Avatar, &member.Role)
		if err != nil {
			return err
		}

		group.Members = append(group.Members, member)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	return nil
}

func (q *Query) fetchGroupEvents(groupID string, group *model.GroupData) error {
	rows, err := q.Db.Query(`
		SELECT
			e.id, e.title, e.description, e.event_time, e.created_at,
			ec.id, ec.first_name, ec.last_name, ec.nickname, ec.avatar,
			u.id, u.first_name, u.last_name, u.nickname, u.avatar, ea.status
		FROM events e
		JOIN users ec ON ec.id = e.creator_id
		LEFT JOIN (
			SELECT * FROM event_attendance WHERE status = 'going'
		) ea ON ea.event_id = e.id
		LEFT JOIN users u ON u.id = ea.user_id
		WHERE e.group_id = ?
		ORDER BY e.event_time
	`, groupID)
	if err != nil {
		return err
	}
	defer rows.Close()

	eventsMap := make(map[string]*model.Events)

	for rows.Next() {
		var (
			eventID, title, description string
			eventTime, createdAt        time.Time

			creator model.Creator
			attendee model.Creator

			nullAttendeeID sql.NullString
			nullFirstName  sql.NullString
			nullLastName   sql.NullString
			nullNickname   sql.NullString
			nullAvatar     sql.NullString
			nullStatus     sql.NullString
		)

		err := rows.Scan(
			&eventID, &title, &description, &eventTime, &createdAt,
			&creator.ID, &creator.FirstName, &creator.LastName, &creator.Nickname, &creator.Avatar,
			&nullAttendeeID, &nullFirstName, &nullLastName, &nullNickname, &nullAvatar, &nullStatus,
		)
		if err != nil {
			return err
		}

		event, exists := eventsMap[eventID]
		if !exists {
			event = &model.Events{
				ID:          eventID,
				Title:       title,
				Description: description,
				EventTime:   eventTime,
				CreatedAt:   createdAt,
				Creator:     creator,
				Attendees:   []model.Creator{},
			}
			eventsMap[eventID] = event
		}

		if nullAttendeeID.Valid {
			attendee.ID = nullAttendeeID.String
			attendee.FirstName = nullFirstName.String
			attendee.LastName = nullLastName.String
			attendee.Nickname = nullNickname.String
			attendee.Avatar = nullAvatar.String
			attendee.Role = nullStatus.String 
			event.Attendees = append(event.Attendees, attendee)
		}
	}

	// Collect all events into the group
	for _, e := range eventsMap {
		group.Events = append(group.Events, *e)
	}
	return nil
}
