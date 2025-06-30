package websocket

import (
	"encoding/json"
	"fmt"

	"social/pkg/model"
	"social/pkg/repository"
	"social/pkg/util"
)

func (c *Client) SendEventNotification(msg map[string]any, q *repository.Query, h *Hub) {
	data, err := json.Marshal(msg["data"])
	if err != nil {
		c.SendError("Invalid data encoding")
		return
	}

	var event model.AddEventData

	if err = json.Unmarshal(data, &event); err != nil {
		c.SendError("Invalid messsage format")
		return
	}

	groupId, err := q.FetchGroupId(event.GroupTitle)
	if err != nil {
		c.SendError("group not found")
		return
	}

	if event.Title == "" || event.EventTime.IsZero() {
		c.SendError("Missing event name or time data")
		return
	}

	// Check for duplicate event creation (idempotency)
	// Check if an event with the same title, creator, group, and time already exists
	existingEvent, err := q.CheckRow("events", []string{
		"title",
		"creator_id",
		"group_id",
		"event_time",
	}, []any{
		event.Title,
		c.UserID,
		groupId,
		event.EventTime,
	})
	if err != nil {
		c.SendError("failed to check for duplicate event")
		return
	}
	if existingEvent {
		c.SendError("Event with the same details already exists")
		return
	}

	eventID := util.UUIDGen()

	err = q.InsertData("events", []string{
		"id",
		"title",
		"creator_id",
		"group_id",
		"event_time",
		"location",
		"description",
	}, []any{
		eventID,
		event.Title,
		c.UserID,
		groupId,
		event.EventTime,
		event.Location,
		event.Description,
	})
	if err != nil {
		c.SendError("failed to add event")
		return
	}

	memberIds, err := q.FetchAllGroupMembersId(groupId)
	if err != nil {
		c.SendError("failed to fetch group members")
		return
	}

	for _, id := range memberIds {
		if id == c.UserID {
			continue
		}

		// Check for duplicate notification (idempotency)
		existingNotification, err := q.CheckRow("notifications", []string{
			"actor_id",
			"recipient_id",
			"type",
			"entity_id",
		}, []any{
			c.UserID,
			id,
			"group_event",
			eventID,
		})
		if err != nil {
			c.SendError("failed to check for duplicate notification")
			return
		}
		if existingNotification {
			// Notification already exists, skip creating duplicate
			continue
		}

		// add notification
		eventStr := fmt.Sprintf(" created event - %s", event.Title)
		err = q.InsertData("notifications", []string{
			"id",
			"actor_id",
			"recipient_id",
			"recipient_group_id",
			"type",
			"message",
			"entity_id",
			"entity_type",
		}, []any{
			util.UUIDGen(),
			c.UserID,
			id,
			groupId,
			"group_event",
			eventStr,
			eventID,
			"group-event",
		})
		if err != nil {
			c.SendError("failed to add notification")
			return
		}
	}

	payload := map[string]any{
		"type": "notification",
		"case": "group_event",
		"data": map[string]any{
			"title":       event.Title,
			"event_time":  event.EventTime.Format("2006-01-02 15:04:05"),
			"location":    event.Location,
			"description": event.Description,
		},
	}

	sendData, err := json.Marshal(payload)
	if err != nil {
		c.SendError("failed to marshal event data")
		return
	}

	h.BroadcastToGroup(c, groupId, sendData)
	c.SendSuccess("Event created successfully")
}
