package repository

import (
	"fmt"

	"fmt"

	"social/pkg/model"
	"fmt"
	"database/sql"
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
			un.created_at,
			u.first_name,
			u.last_name,
			u.avatar
		FROM notifications un
		LEFT JOIN users u ON u.id = un.actor_id
		WHERE un.recipient_id = ?
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
		var actorFirstName, actorLastName, actorAvatar sql.NullString

		err := rows.Scan(
			&notification.ID, &notification.ActorId, &notification.Type, &notification.EntityID, &notification.EntityType,
			&notification.IsRead, &notification.Message, &notification.CreatedAt,
			&actorFirstName, &actorLastName, &actorAvatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan notification with actor: %w", err)
			return nil, fmt.Errorf("failed to scan notification with actor: %w", err)
		}
		notification.ActorFirstName = actorFirstName.String
		notification.ActorLastName = actorLastName.String
		notification.ActorAvatar = actorAvatar.String
		notifications = append(notifications, notification)
	}


	return notifications, nil
}
