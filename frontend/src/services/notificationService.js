const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Service for handling notification API calls
 * Integrates with backend /api/notifications endpoint
 */
class NotificationService {

  /**
   * Fetch all notifications for current user from database
   * @returns {Promise<Array>} Array of notifications from database
   */
  async fetchNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please login again');
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();

      // FIXED: Backend returns {message: notifications[]} format, not {data: notifications[]}
      // Work with exactly what backend provides
      const notifications = Array.isArray(data) ? data : (data.message || data.data || []);

      // Transform backend notification format to frontend format
      const transformedNotifications = notifications.map(notif => this.transformBackendNotification(notif));

      return transformedNotifications;

    } catch (error) {
      console.error('[NotificationService] Fetch failed:', error);
      throw error;
    }
  }

  /**
   * Transform backend notification format to frontend format
   * Backend: { id, actor_id, type, entity_id, entity_type, is_read, message, created_at }
   * Frontend: { id, type, content, actor, timestamp, read, actionable, data }
   */
  transformBackendNotification(backendNotif) {
    return {
      id: backendNotif.ID || backendNotif.id,
      type: backendNotif.Type || backendNotif.type,
      content: backendNotif.Message || backendNotif.message || 'New notification',
      actor: backendNotif.ActorId ? {
        id: backendNotif.ActorId,
        firstName: backendNotif.actor_first_name || backendNotif.ActorFirstName || '',
        lastName: backendNotif.actor_last_name || backendNotif.ActorLastName || '',
        avatar: backendNotif.actor_avatar || backendNotif.ActorAvatar || null
      } : null,
      timestamp: new Date(backendNotif.CreatedAt || backendNotif.created_at),
      read: Boolean(backendNotif.IsRead || backendNotif.is_read),
      actionable: this.isActionableType(backendNotif.Type || backendNotif.type),
      entityId: backendNotif.EntityID || backendNotif.entity_id,
      entityType: backendNotif.EntityType || backendNotif.entity_type,
      data: {
        entity_id: backendNotif.EntityID || backendNotif.entity_id,
        entity_type: backendNotif.EntityType || backendNotif.entity_type,
        actor_id: backendNotif.ActorId || backendNotif.actor_id
      }
    };
  }

  /**
   * Determine if notification type requires user action
   */
  isActionableType(type) {
    const actionableTypes = [
      'follow_request',
      'group_invitation',
      'group_join_request'
    ];
    return actionableTypes.includes(type);
  }

  /**
   * Mark notification as read via WebSocket
   * Backend expects: { type: "read_notification", data: { notification_id: string } }
   */
  async markAsRead(notificationId) {
    try {
      // Use WebSocket manager to send read notification
      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.sendMessage('read_notification', {
          notification_id: notificationId
        });
        return true;
      } else {
        console.warn('[NotificationService] WebSocket not connected, cannot mark as read');
        return false;
      }
    } catch (error) {
      console.error('[NotificationService] Mark as read failed:', error);
      return false;
    }
  }

  /**
   * Respond to group invitation via WebSocket
   * Backend expects: { type: "respond_group_invitation", data: { group_id: string, status: "accepted"|"declined" } }
   */
  async respondToGroupInvitation(groupId, status) {
    try {
      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.sendMessage('respond_group_invitation', {
          group_id: groupId,
          status: status
        });
        return true;
      } else {
        console.warn('[NotificationService] WebSocket not connected, cannot respond to invitation');
        return false;
      }
    } catch (error) {
      console.error('[NotificationService] Group invitation response failed:', error);
      return false;
    }
  }

  /**
   * Respond to follow request via WebSocket
   * Backend expects: { type: "respond_follow_request", data: { user_id: string, status: "accepted"|"declined" } }
   */
  async respondToFollowRequest(userId, status) {
    try {
      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.sendMessage('respond_follow_request', {
          user_id: userId,
          status: status
        });
        return true;
      } else {
        console.warn('[NotificationService] WebSocket not connected, cannot respond to follow request');
        return false;
      }
    } catch (error) {
      console.error('[NotificationService] Follow request response failed:', error);
      return false;
    }
  }
}

export default new NotificationService();