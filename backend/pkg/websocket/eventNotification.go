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
		"",
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
