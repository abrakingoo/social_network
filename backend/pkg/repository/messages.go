package repository

import (
	"database/sql"
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

		// Ensure compatibility with both RecipientID and ReceiverID fields
		msg.RecipientID = msg.ReceiverID
		// Ensure compatibility with both Content and Message fields
		msg.Message = msg.Content

		messages = append(messages, msg)
	}

	return messages, nil
}

func (q *Query) GetGroupMessages(groupID string) ([]model.GroupMessage, error) {
	query := `
		SELECT
			gm.id, gm.group_id, gm.sender_id, gm.content, gm.created_at,
			u.first_name, u.last_name, u.nickname, u.avatar
		FROM group_messages gm
		LEFT JOIN users u ON u.id = gm.sender_id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC
	`

	rows, err := q.Db.Query(query, groupID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch group messages: %w", err)
	}
	defer rows.Close()

	var messages []model.GroupMessage

	for rows.Next() {
		var msg model.GroupMessage
		var firstName, lastName, nickname, avatar sql.NullString

		err := rows.Scan(
			&msg.ID, &msg.GroupId, &msg.SenderID, &msg.Content, &msg.CreatedAt,
			&firstName, &lastName, &nickname, &avatar,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan group message row: %w", err)
		}

		// Set sender information
		msg.Sender = model.UserSummary{
			ID:        msg.SenderID,
			Firstname: firstName.String,
			Lastname:  lastName.String,
			Nickname:  nickname.String,
			Avatar:    avatar.String,
		}

		// Ensure compatibility with both Content and Message fields
		msg.Message = msg.Content

		messages = append(messages, msg)
	}

	return messages, nil
}