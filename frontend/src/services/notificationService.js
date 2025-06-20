// frontend/src/services/notificationService.js - SIMPLIFIED

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class NotificationService {

  async fetchNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'GET',
        credentials: 'include',
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
      const notifications = Array.isArray(data) ? data : (data.message || data.data || []);

      return notifications.map(notif => this.transformBackendNotification(notif));
    } catch (error) {
      throw error;
    }
  }

  transformBackendNotification(backendNotif) {
    let actor = null;
    if (backendNotif.actor) {
      actor = {
        id: backendNotif.actor.id || '',
        firstName: backendNotif.actor.first_name || backendNotif.actor.firstName || '',
        lastName: backendNotif.actor.last_name || backendNotif.actor.lastName || '',
        avatar: backendNotif.actor.avatar || null,
        nickname: backendNotif.actor.nickname || '',
      };
    } else if (backendNotif.ActorId) {
      actor = {
        id: backendNotif.ActorId,
        firstName: backendNotif.actor_first_name || backendNotif.ActorFirstName || '',
        lastName: backendNotif.actor_last_name || backendNotif.ActorLastName || '',
        avatar: backendNotif.actor_avatar || backendNotif.ActorAvatar || null,
        nickname: backendNotif.actor_nickname || backendNotif.ActorNickname || '',
      };
    }

    // Handle sql.NullString for entity_id
    let entityId = null;
    if (backendNotif.entity_id && backendNotif.entity_id !== null) {
      if (typeof backendNotif.entity_id === 'object' && backendNotif.entity_id.String && backendNotif.entity_id.Valid) {
        entityId = backendNotif.entity_id.String;
      } else if (typeof backendNotif.entity_id === 'string') {
        entityId = backendNotif.entity_id;
      } else {
        entityId = String(backendNotif.entity_id);
      }
    } else if (backendNotif.EntityID) {
      if (typeof backendNotif.EntityID === 'object' && backendNotif.EntityID.String && backendNotif.EntityID.Valid) {
        entityId = backendNotif.EntityID.String;
      } else {
        entityId = backendNotif.EntityID;
      }
    }

    return {
      id: backendNotif.ID || backendNotif.id,
      type: backendNotif.Type || backendNotif.type,
      content: backendNotif.Message || backendNotif.message || 'New notification',
      actor,
      timestamp: new Date(backendNotif.CreatedAt || backendNotif.created_at),
      read: Boolean(backendNotif.IsRead || backendNotif.is_read),
      actionable: this.isActionableType(backendNotif.Type || backendNotif.type),
      entityId: entityId,
      entityType: backendNotif.EntityType || backendNotif.entity_type,
      data: {
        entity_id: entityId,
        entity_type: backendNotif.EntityType || backendNotif.entity_type,
        actor_id: (actor && actor.id) || backendNotif.ActorId || backendNotif.actor_id
      }
    };
  }

  isActionableType(type) {
    const actionableTypes = ['follow_request', 'group_invitation', 'group_join_request'];
    return actionableTypes.includes(type);
  }

  async markAsRead(notificationId) {
    try {
      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.send('read_notification', {
          notification_id: notificationId
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async respondToGroupInvitation(groupId, status) {
    try {
      if (!groupId || typeof groupId !== 'string') {
        throw new Error('Invalid groupId provided');
      }

      if (!status || !['accepted', 'declined'].includes(status)) {
        throw new Error('Invalid status provided. Must be "accepted" or "declined"');
      }

      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.send('respond_group_invitation', {
          group_id: groupId,
          status: status
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async respondToFollowRequest(userId, status) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }

      if (!status || !['accepted', 'declined'].includes(status)) {
        throw new Error('Invalid status provided. Must be "accepted" or "declined"');
      }

      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.send('respond_follow_request', {
          recipient_Id: userId,
          status: status
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async deleteNotification(notificationId) {
    try {
      if (!notificationId || typeof notificationId !== 'string') {
        throw new Error('Invalid notificationId provided');
      }

      const { wsManager } = await import('@/utils/websocket');

      if (wsManager.isConnected()) {
        wsManager.send('delete_notification', {
          notification_id: notificationId
        });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async getConnectionStatus() {
    try {
      const { wsManager } = await import('@/utils/websocket');
      return {
        isConnected: wsManager.isConnected(),
        connectionInfo: wsManager.getConnectionInfo()
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error.message
      };
    }
  }
}

export default new NotificationService();