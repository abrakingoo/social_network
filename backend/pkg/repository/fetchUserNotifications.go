package repository

import (
	"fmt"

	"fmt"

	"social/pkg/model"
	"fmt"
)

func (q *Query) GetUserNotifications(userID string) ([]model.UserNotification, error) {
	query := `
		SELECT
			un.id,
			un.type,
			un.entity_id,
			un.entity_type,
			un.is_read,
			un.message,
			un.created_at
		FROM notifications un
		WHERE recipient_id = ?
	`

	rows, err := q.Db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user notifications: %w", err)
		return nil, fmt.Errorf("failed to get user notifications: %w", err)
	}

	defer rows.Close()

	var notifications []model.UserNotification

	for rows.Next() {
		var notification model.UserNotification

		err := rows.Scan(
			&notification.ID, &notification.ActorId, &notification.Type, &notification.EntityID, &notification.EntityType,
			&notification.IsRead, &notification.Message, &notification.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan notification with actor: %w", err)
			return nil, fmt.Errorf("failed to scan notification with actor: %w", err)
		}

		notifications = append(notifications, notification)

	}


	return notifications, nil

}
