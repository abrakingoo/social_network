// frontend/src/services/groupService.js - CORRECTED: Perfect backend integration
import { webSocketOperations } from '@/utils/websocket';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Error types for better error handling
const GroupErrorTypes = {
  NOT_FOUND: 'GROUP_NOT_FOUND',
  ALREADY_EXISTS: 'DUPLICATE_GROUP_TITLE',
  PERMISSION_DENIED: 'DELETE_PERMISSION_DENIED',
  INVALID_INPUT: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Helper function to handle API responses
const handleApiResponse = async (response, errorContext, preReadData = null) => {
  const data = preReadData || await response.json();

  if (!response.ok) {
    console.error(`[groupService.${errorContext}] Error response:`, {
      status: response.status,
      statusText: response.statusText,
      data
    });

    let errorType = GroupErrorTypes.UNKNOWN_ERROR;
    let errorMessage = data.error || 'An unexpected error occurred';

    // Map HTTP status codes to error types
    switch (response.status) {
      case 404:
        errorType = GroupErrorTypes.NOT_FOUND;
        errorMessage = data.error || 'Group not found';
        break;
      case 409:
        errorType = GroupErrorTypes.ALREADY_EXISTS;
        errorMessage = data.error || 'Group with this title already exists';
        break;
      case 403:
        errorType = GroupErrorTypes.PERMISSION_DENIED;
        errorMessage = data.error || 'You do not have permission to perform this action';
        break;
      case 400:
        errorType = GroupErrorTypes.INVALID_INPUT;
        errorMessage = data.error || 'Invalid input provided';
        break;
    }

    const error = new Error(errorMessage);
    error.type = errorType;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Helper function to get common headers
const getHeaders = (includeContentType = false) => {
  const headers = {
    'Accept': 'application/json'
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Helper function to handle WebSocket errors with exact backend error messages
const handleWebSocketError = (error, operation) => {
  console.error(`[groupService.${operation}] WebSocket error:`, error);

  // The error messages are already mapped in the WebSocket operations
  // Just re-throw the error as-is since webSocketOperations handles the mapping
  throw error;
};

export const groupService = {
  // ==================== REST API OPERATIONS ====================

  // Fetch all groups - CORRECTED: Handle exact backend response format
  async getAllGroups({ search = '', filter = 'all' } = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(filter !== 'all' && { filter })
      });

      const response = await fetch(`${API_BASE_URL}/api/groups?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: getHeaders(false)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch groups');
      }

      let groupsArray = [];

      // Handle different response formats from backend
      if (data.message === null) {
        console.warn('[groupService.getAllGroups] Backend returned message: null. Treating as empty array.');
        groupsArray = [];
      } else if (Array.isArray(data.message)) {
        groupsArray = data.message;
      } else if (Array.isArray(data.groups)) {
        groupsArray = data.groups;
      } else if (Array.isArray(data)) {
        groupsArray = data;
      } else {
        console.error('[groupService.getAllGroups] Unexpected response format:', { data });
        throw new Error('Server returned an unexpected response format.');
      }

      return { groups: groupsArray };
    } catch (error) {
      console.error('[groupService.getAllGroups] Error:', error);

      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to view groups.');
      }

      throw error;
    }
  },

  // Create a new group - CORRECTED: Match exact backend endpoint
  async createGroup(groupData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addGroup`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true),
        body: JSON.stringify({
          title: groupData.name,
          description: groupData.description || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle exact backend error responses
        if (response.status === 400 && data.error === 'Title cannot be empty') {
          throw new Error('Group title is required');
        }
        throw new Error(data.error || 'Failed to create group');
      }

      return {
        success: true,
        message: data.message || 'Group created successfully',
        group_id: data.group_id
      };
    } catch (error) {
      console.error('[groupService.createGroup] Error:', error);

      if (error.type === GroupErrorTypes.ALREADY_EXISTS) {
        throw error; // Preserve the specific error for duplicate titles
      }

      throw new Error('Failed to create group. Please try again.');
    }
  },

  // Get detailed group information - CORRECTED: Use exact backend endpoint
  async getGroupDetails(groupTitle) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getGroupData?title=${encodeURIComponent(groupTitle)}`, {
        method: 'GET',
        credentials: 'include',
        headers: getHeaders(false)
      });

      const data = await handleApiResponse(response, 'getGroupDetails');
      return data.message || data;
    } catch (error) {
      if (error.type === GroupErrorTypes.NOT_FOUND) {
        throw new Error('Group not found or you do not have access to it.');
      }
      throw error;
    }
  },

  // Delete a group - CORRECTED: Use exact backend endpoint
  async deleteGroup(groupTitle) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deleteGroup`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders(true),
        body: JSON.stringify({ title: groupTitle })
      });

      const data = await handleApiResponse(response, 'deleteGroup');
      return {
        success: true,
        message: data.message,
        deleted_group_title: groupTitle
      };
    } catch (error) {
      if (error.type === GroupErrorTypes.PERMISSION_DENIED) {
        throw new Error('You do not have permission to delete this group.');
      }
      throw error;
    }
  },

  // Create a new event - CORRECTED: Use exact backend endpoint
  async createEvent(eventData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addEvent`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true),
        body: JSON.stringify(eventData)
      });

      const data = await handleApiResponse(response, 'createEvent');

      return {
        success: true,
        message: data.message || 'Event created successfully'
      };
    } catch (error) {
      console.error('[groupService.createEvent] Error:', error);

      if (error.type === GroupErrorTypes.INVALID_INPUT) {
        throw new Error('Invalid event data provided. Please check the event details.');
      }

      throw new Error('Failed to create event. Please try again.');
    }
  },

  // RSVP to an event - CORRECTED: Use exact backend endpoint and payload format
  async rsvpEvent(eventId, status) {
    try {
      // Ensure status is properly formatted - backend expects exact values
      const formattedStatus = status === "going" ? "going" : "not_going";

      const requestPayload = {
        eventId: eventId,        //   Backend expects "eventId", not "event_id"
        status: formattedStatus  //   Backend expects "status", not "response"
      };

      const response = await fetch(`${API_BASE_URL}/api/rsvp`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true),
        body: JSON.stringify(requestPayload)
      });

      const data = await handleApiResponse(response, 'rsvpEvent');

      return {
        success: true,
        message: data.message || 'RSVP updated successfully',
        attendeeCount: data.message || 0 // Backend returns count as message
      };
    } catch (error) {
      console.error('[groupService.rsvpEvent] Error details:', {
        error: error.message,
        eventId,
        status,
        errorType: error.type
      });

      if (error.type === GroupErrorTypes.NOT_FOUND) {
        throw new Error('Event not found or you do not have access to it.');
      }

      if (error.status === 400) {
        throw new Error('Invalid RSVP data. Please try again.');
      }

      if (error.status === 401) {
        throw new Error('You must be logged in to RSVP to events.');
      }

      throw new Error('Failed to update RSVP. Please try again.');
    }
  },

  // Get event details - CORRECTED: Use exact backend endpoint
  async getEventDetails(eventId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getEventData?event_id=${encodeURIComponent(eventId)}`, {
        credentials: 'include',
        headers: getHeaders(false)
      });

      const data = await handleApiResponse(response, 'getEventDetails');
      return data;
    } catch (error) {
      if (error.type === GroupErrorTypes.NOT_FOUND) {
        throw new Error('Event not found or you do not have access to it.');
      }
      throw error;
    }
  },

  // Get all users for invitations -   Enhanced error handling and debugging
  async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        credentials: 'include',
        headers: getHeaders(false)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[groupService.getAllUsers] Error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      // Handle 204 No Content response
      if (response.status === 204) {
        return [];
      }

      const data = await response.json();

      // Extract user relations from the response
      const userRelations = data.message || data;

      // Validate that userRelations is an object
      if (!userRelations || typeof userRelations !== 'object') {
        return [];
      }

      //   Safely combine all user categories with proper null/undefined handling
      const allUsers = [];

      // Helper function to safely add users from a category
      const addUsersFromCategory = (category, categoryName) => {
        if (Array.isArray(category) && category.length > 0) {
          allUsers.push(...category);
        } else {
        }
      };

      // Process each user category with exact field names from backend
      addUsersFromCategory(userRelations.followers, 'followers');
      addUsersFromCategory(userRelations.following, 'following');
      addUsersFromCategory(userRelations.non_mutual, 'non_mutual');
      addUsersFromCategory(userRelations.received_request, 'received_request');
      addUsersFromCategory(userRelations.sent_request, 'sent_request');

      if (allUsers.length > 0) {
        console.log(`[groupService.getAllUsers] Sample user:`, allUsers[0]);
      }

      //   Remove duplicates based on user ID and ensure valid user objects
      const uniqueUsers = [];
      const seenIds = new Set();

      for (const user of allUsers) {
        if (user && user.id && !seenIds.has(user.id)) {
          // Validate user object has required fields
          if (user.firstname || user.first_name) {
            seenIds.add(user.id);
            uniqueUsers.push(user);
          } else {
            console.warn('[groupService.getAllUsers] Skipping user with missing name fields:', user);
          }
        }
      }

      return uniqueUsers;

    } catch (error) {
      console.error('[groupService.getAllUsers] Error:', error);
      console.error('[groupService.getAllUsers] Error message:', error.message);
      console.error('[groupService.getAllUsers] Error stack:', error.stack);

      // Return empty array instead of throwing to prevent UI from breaking
      // The UI will show "No users available to invite" which is better than a broken state
      return [];
    }
  },

  // ==================== WEBSOCKET OPERATIONS ====================

  // Join a group - Uses corrected WebSocket infrastructure
  async joinGroup(groupId) {
    try {
      const result = await webSocketOperations.joinGroup(groupId);

      return {
        success: true,
        message: result.message || 'Join request sent successfully'
      };
    } catch (error) {
      handleWebSocketError(error, 'joinGroup');
    }
  },

  // Leave a group - Uses corrected WebSocket infrastructure
  async leaveGroup(groupId) {
    try {
      const result = await webSocketOperations.leaveGroup(groupId);
      return {
        success: true,
        message: result.message || 'Successfully left the group'
      };
    } catch (error) {
      handleWebSocketError(error, 'leaveGroup');
    }
  },

  // Invite user to group - Uses corrected WebSocket infrastructure
  async inviteToGroup(groupId, userId) {
    try {
      const result = await webSocketOperations.inviteToGroup(groupId, userId);

      return {
        success: true,
        message: result.message || 'Invitation sent successfully'
      };
    } catch (error) {
      handleWebSocketError(error, 'inviteToGroup');
    }
  },

  // Respond to group invitation - Uses corrected WebSocket infrastructure
  async respondToGroupInvitation(groupId, status) {
    try {
      const result = await webSocketOperations.respondToGroupInvitation(groupId, status);

      return {
        success: true,
        message: result.message || `Group invitation ${status}`
      };
    } catch (error) {
      handleWebSocketError(error, 'respondToGroupInvitation');
    }
  },

  // Respond to join request - Uses corrected WebSocket infrastructure
  async respondToJoinRequest(groupId, userId, status) {
    try {

      const result = await webSocketOperations.respondToJoinRequest(groupId, userId, status);

      return {
        success: true,
        message: result.message || `Join request ${status}`
      };
    } catch (error) {
      handleWebSocketError(error, 'respondToJoinRequest');
    }
  },

  // Propose member invitation - Uses WebSocket for member invitation proposals
  async proposeMemberInvitation(groupId, userId) {
    try {
      const result = await webSocketOperations.proposeMemberInvitation(groupId, userId);

      return {
        success: true,
        message: result.message || 'Invitation proposal sent successfully'
      };
    } catch (error) {
      handleWebSocketError(error, 'proposeMemberInvitation');
    }
  },
};

export default groupService;