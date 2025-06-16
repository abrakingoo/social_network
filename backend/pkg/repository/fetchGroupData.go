package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"social/pkg/model"
)

func (q *Query) FetchGroupData(groupid string) (model.GroupData, error) {
	return q.FetchGroupDataWithUser(groupid, "")
}

// ENHANCED: Now includes join requests for group admins
func (q *Query) FetchGroupDataWithUser(groupid string, userID string) (model.GroupData, error) {
	var group model.GroupData
	var err error

	// fetch available group info
	if err := q.fetchGroupInfo(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	// fetch group post
	group.Posts, err = q.fetchGroupPosts(groupid)
	if err != nil {
		return model.GroupData{}, err
	}

	// fetch all group members
	if err := q.fetchGroupMembers(groupid, &group); err != nil {
		return model.GroupData{}, err
	}

	// fetch all group events information with user RSVP status
	if err := q.fetchGroupEvents(groupid, &group, userID); err != nil {
		return model.GroupData{}, err
	}

	// NEW: fetch join requests if user is group admin
	if userID != "" {
		if isAdmin := q.isUserGroupAdmin(groupid, userID); isAdmin {
			joinRequests, err := q.fetchGroupJoinRequests(groupid)
			if err != nil {
				// Log error but don't fail the entire request
				fmt.Printf("Warning: Failed to fetch join requests for group %s: %v\n", groupid, err)
			} else {
				group.JoinRequests = joinRequests
			}
		}
	}

	return group, nil
}

// NEW: Check if user is group admin
func (q *Query) isUserGroupAdmin(groupID, userID string) bool {
	var role string
	query := `SELECT role FROM group_members WHERE group_id = ? AND user_id = ?`
	err := q.Db.QueryRow(query, groupID, userID).Scan(&role)
	return err == nil && role == "admin"
}

// NEW: Fetch pending join requests for group (admin only)
func (q *Query) fetchGroupJoinRequests(groupID string) ([]model.JoinRequest, error) {
	query := `
		SELECT
			gjr.id, gjr.user_id, gjr.created_at, gjr.status,
			u.first_name, u.last_name, u.nickname, u.avatar
		FROM group_join_requests gjr
		JOIN users u ON gjr.user_id = u.id
		WHERE gjr.group_id = ? AND gjr.status = 'pending'
		ORDER BY gjr.created_at DESC
	`

	rows, err := q.Db.Query(query, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch join requests: %w", err)
	}
	defer rows.Close()

	var joinRequests []model.JoinRequest

	for rows.Next() {
		var req model.JoinRequest
		var user model.Creator

		err := rows.Scan(
			&req.ID, &req.UserID, &req.CreatedAt, &req.Status,
			&user.FirstName, &user.LastName, &user.Nickname, &user.Avatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan join request: %w", err)
		}

		// Set user ID and attach user info
		user.ID = req.UserID
		req.User = user

		joinRequests = append(joinRequests, req)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating join requests: %w", err)
	}

	return joinRequests, nil
}

func (q *Query) fetchGroupInfo(groupid string, group *model.GroupData) error {
	row := q.Db.QueryRow(`
        SELECT g.id, g.title, g.description,
		g.created_at, u.id, u.first_name, u.last_name, u.nickname, u.avatar
		FROM groups g
		JOIN users u ON u.id = g.creator_id
        WHERE g.id = ?
    `, groupid)

	user := model.Creator{}

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

func (q *Query) fetchGroupEvents(groupID string, group *model.GroupData, userID string) error {
	// First query: Get all events
	eventRows, err := q.Db.Query(`
		SELECT
			e.id, e.title, e.description, e.event_time, e.created_at, e.location,
			ec.id, ec.first_name, ec.last_name, ec.nickname, ec.avatar, e.going_count
		FROM events e
		JOIN users ec ON ec.id = e.creator_id
		WHERE e.group_id = ?
		ORDER BY e.event_time
	`, groupID)
	if err != nil {
		return err
	}
	defer eventRows.Close()

	var events []model.Events
	var eventIDs []string

	for eventRows.Next() {
		var event model.Events
		err := eventRows.Scan(
			&event.ID, &event.Title, &event.Description, &event.EventTime, &event.CreatedAt, &event.Location,
			&event.Creator.ID, &event.Creator.FirstName, &event.Creator.LastName,
			&event.Creator.Nickname, &event.Creator.Avatar, &event.RsvpCount,
		)
		if err != nil {
			return err
		}

		// Get user's RSVP status for this event
		if userID != "" {
			status, err := q.GetUserRsvpStatus(event.ID, userID)
			if err != nil {
				return err
			}
			event.UserRsvpStatus = status
		}

		event.Attendees = []model.Creator{}
		events = append(events, event)
		eventIDs = append(eventIDs, event.ID)
	}

	if err = eventRows.Err(); err != nil {
		return err
	}

	// Second query: Get attendees for all events
	if len(eventIDs) > 0 {
		// Create placeholders for IN clause
		placeholders := make([]string, len(eventIDs))
		args := make([]interface{}, len(eventIDs))
		for i, id := range eventIDs {
			placeholders[i] = "?"
			args[i] = id
		}

		attendeeQuery := fmt.Sprintf(`
			SELECT ea.event_id, u.id, u.first_name, u.last_name, u.nickname, u.avatar
			FROM event_attendance ea
			JOIN users u ON u.id = ea.user_id
			WHERE ea.event_id IN (%s) AND ea.status = 'going'
			ORDER BY ea.event_id, u.first_name
		`, strings.Join(placeholders, ","))

		attendeeRows, err := q.Db.Query(attendeeQuery, args...)
		if err != nil {
			return err
		}
		defer attendeeRows.Close()

		// Create map for quick event lookup
		eventMap := make(map[string]*model.Events)
		for i := range events {
			eventMap[events[i].ID] = &events[i]
		}

		for attendeeRows.Next() {
			var eventID string
			var attendee model.Creator

			err := attendeeRows.Scan(
				&eventID, &attendee.ID, &attendee.FirstName,
				&attendee.LastName, &attendee.Nickname, &attendee.Avatar,
			)
			if err != nil {
				return err
			}

			if event, exists := eventMap[eventID]; exists {
				event.Attendees = append(event.Attendees, attendee)
			}
		}

		if err = attendeeRows.Err(); err != nil {
			return err
		}
	}

	group.Events = events
	return nil
}

func (q *Query) FetchGroupId(title string) (string, error) {
	var id string
	row := q.Db.QueryRow(`
		SELECT id
		FROM groups
		WHERE title = ?
		LIMIT 1
	`, title)

	err := row.Scan(&id)
	if err == sql.ErrNoRows {
		return "", errors.New("the group does not exist")
	}

	if err != nil {
		return "", fmt.Errorf("database error: %v", err)
	}

	return id, nil
}