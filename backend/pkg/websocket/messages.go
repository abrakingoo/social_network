package websocket

import (
	"log"

	"social/pkg/repository"
)

// processMessages dispatches on msg["type"]
func (c *Client) ProcessMessages(q *repository.Query) {
	for msg := range c.ProcessChan {
		log.Printf("User %s sent: %v", c.UserID, msg)
		switch msg["type"] {
		case "follow_request":
			c.FollowRequest(msg, q)
		case "respond_follow_request":
			c.RespondFollowRequest(msg, q)
		case "Unfollow":
			c.Unfollow(msg, q)
		case "exit_group":
			c.ExitGroup(msg, q)
		case "group_invitation":
			c.SendInvitation(msg, q)
		case "respond_group_invitation":
			c.RespondSendInvitation(msg, q)
		case "group_join_request":
			c.GroupJoinRequest(msg, q)
		case "respond_group_join_request":
			c.RespondGroupJoinRequest(msg, q)
		default:
			c.SendError("Unknown message type")
		}
	}
}
