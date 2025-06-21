package websocket

import (
	"log"

	"social/pkg/repository"
)

// processMessages dispatches on msg["type"]
func (c *Client) ProcessMessages(q *repository.Query, h *Hub) {
	for msg := range c.ProcessChan {
		log.Printf("User %s sent: %v", c.UserID, msg)
		switch msg["type"] {
		case "follow_request":
			c.FollowRequest(msg, q, h)
		case "respond_follow_request":
			c.RespondFollowRequest(msg, q)
		case "unfollow":
			c.Unfollow(msg, q)
		case "exit_group":
			c.ExitGroup(msg, q, h)
		case "group_invitation":
			c.SendInvitation(msg, q, h)
		case "respond_group_invitation":
			c.RespondSendInvitation(msg, q)
		case "group_join_request":
			c.GroupJoinRequest(msg, q, h)
		case "respond_group_join_request":
			c.RespondGroupJoinRequest(msg, q, h)
		case "cancel_follow_request":
			c.CancelFollowRequest(msg, q)
		case "private_message":
			c.PrivateMessage(msg, q, h)
		case "group_message":
			c.GroupMessage(msg, q, h)
		case "read_notification":
			c.ReadNotification(msg, q)
		case "read_private_message":
			c.ReadPrivateMessage(msg, q)
		case "cancel_group_invitation":
			c.CancelGroupInvitation(msg, q)
		case "cancel_group_join_request":
			c.CancelGroupJoinRequest(msg, q)
		case "load_private_messages":
			c.LoadPrivateMessages(msg, q)
		case "load_group_messages":
			c.LoadGroupMessages(msg, q)
		case "delete_notification":
			c.DeleteNotification(msg, q)
		case "member_group_invitation_proposal":
			c.SendMemberInvitationProposal(msg, q, h)
		default:
			c.SendError("Unknown message type")
		}
	}
}
