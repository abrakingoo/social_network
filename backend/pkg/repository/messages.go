package repository

import (
	"fmt"

	"social/pkg/model"
)

func (q *Query) GetMessagesBetweenUsers(userAID, userBID string) ([]model.PrivateMessage, error) {
	query := `
		SELECT id, sender_id, receiver_id, content, is_read, created_at
		FROM private_messages
		WHERE 
			(sender_id = ? AND receiver_id = ?) OR
			(sender_id = ? AND receiver_id = ?)
		ORDER BY created_at ASC
	`

	rows, err := q.Db.Query(query, userAID, userBID, userBID, userAID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages between users: %w", err)
	}
	defer rows.Close()

	var messages []model.PrivateMessage

	for rows.Next() {
		var msg model.PrivateMessage
		err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.IsRead, &msg.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message row: %w", err)
		}
		messages = append(messages, msg)
	}

	return messages, nil
}
