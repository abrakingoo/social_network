package repository

import (
	"fmt"

	"social/pkg/model"
)

func (q *Query) GetUserNotifications(userID string) ([]model.UserNotification, error) {
	query := `
		SELECT
			un.id,
			un.type,
			un.is_read,
			un.message,
			un.created_at,
			un.recipient_group_id,
			un.entity_id,
			un.entity_type,
			u.id,
			u.email,
			u.first_name,
			u.last_name,
			u.avatar,
			u.nickname,
			u.is_public,
			u.date_of_birth,
			u.about_me,
			u.created_at
		FROM notifications un
		JOIN users u ON u.id = un.actor_id
		WHERE un.recipient_id = ?
        AND un.is_read = 0;
	`

	rows, err := q.Db.Query(query, userID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user notifications: %w", err)
	}
	defer rows.Close()

	var notifications []model.UserNotification

	for rows.Next() {
		var notification model.UserNotification
		var actor model.User

		err := rows.Scan(
			&notification.ID,
			&notification.Type,
			&notification.IsRead,
			&notification.Message,
			&notification.CreatedAt,
			&notification.GroupID,
			&notification.EntityID,
			&notification.EntityType,
			&actor.ID,
			&actor.Email,
			&actor.FirstName,
			&actor.LastName,
			&actor.Avatar,
			&actor.Nickname,
			&actor.IsPublic,
			&actor.DateOfBirth,
			&actor.AboutMe,
			&actor.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan notification with actor: %w", err)
		}

		notification.Actor = &actor
		notifications = append(notifications, notification)
	}

	return notifications, nil
}
