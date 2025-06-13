// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Error types for better error handling
const GroupErrorTypes = {
  NOT_FOUND: 'GROUP_NOT_FOUND',
  ALREADY_EXISTS: 'DUPLICATE_GROUP_TITLE',
  PERMISSION_DENIED: 'DELETE_PERMISSION_DENIED',
  INVALID_INPUT: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
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

export const groupService = {
  // Fetch all groups without pagination
  async getAllGroups({ search = '', filter = 'all' } = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(filter !== 'all' && { filter })
      });

      console.log('[groupService.getAllGroups] Fetching groups with params:', {
        url: `${API_BASE_URL}/api/groups`,
        params: Object.fromEntries(queryParams),
        headers: getHeaders(false)
      });

      const response = await fetch(`${API_BASE_URL}/api/groups?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: getHeaders(false)
      });

      console.log('[groupService.getAllGroups] Response status:', response.status);

      // Log response headers for debugging
      console.log('[groupService.getAllGroups] Response headers:', {
        'content-type': response.headers.get('content-type'),
        'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining')
      });

      const data = await response.json();
      console.log('[groupService.getAllGroups] Raw response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch groups');
      }

      let groupsArray = [];

      // Explicitly handle null first, then check for array, then other unexpected types
      if (data.message === null) {
        console.warn('[groupService.getAllGroups] Backend returned message: null. Treating as empty array.');
        groupsArray = []; // Ensure it's explicitly an empty array
      } else if (Array.isArray(data.message)) {
        groupsArray = data.message;
      } else {
        // This means data.message is neither null nor an array (e.g., undefined, string, object, etc.)
        console.error('[groupService.getAllGroups] Unexpected response format: Expected `message` to be an array or null.', {
          data
        });
        throw new Error('Server returned an unexpected response format: Expected `message` to be an array or null.');
      }

      // No pagination info needed as we are fetching all groups
      console.log('[groupService.getAllGroups] Processed response:', {
        groupsCount: groupsArray.length
      });

      return {
        groups: groupsArray,
        // No pagination object to return
      };
    } catch (error) {
      console.error('[groupService.getAllGroups] Error:', {
        message: error.message,
        type: error.type,
        status: error.status,
        data: error.data,
        stack: error.stack
      });

      if (error.type === GroupErrorTypes.NETWORK_ERROR) {
        throw new Error('Network error while fetching groups. Please check your connection.');
      }

      // Add more specific error handling
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to view groups.');
      }

      throw error;
    }
  },

  // Create a new group
  async createGroup(groupData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addGroup`, {
        method: 'POST',
        credentials: 'include', // Important for session cookie
        headers: getHeaders(true), // Only include Content-Type and Accept headers
        body: JSON.stringify({
          title: groupData.name,
          description: groupData.description || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      return {
        success: true,
        message: data.message,
        group_id: data.group_id
      };
    } catch (error) {
      console.error('[groupService.createGroup] Error:', {
        message: error.message,
        type: error.type,
        status: error.status,
        data: error.data
      });

      if (error.type === GroupErrorTypes.ALREADY_EXISTS) {
        throw error; // Preserve the specific error for duplicate titles
      }

      throw new Error('Failed to create group. Please try again.');
    }
  },

  // Get group details by title (FIXED with proper data extraction and debugging)
  async getGroupDetails(groupTitle) {
    try {
      // The backend expects a POST request with JSON body containing the group title
      const response = await fetch(`${API_BASE_URL}/api/getGroupData`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type for JSON body
        body: JSON.stringify({
          title: groupTitle
        })
      });

      const rawData = await response.json();
      console.log('[groupService.getGroupDetails] Raw response data:', rawData);

      // Handle the response using the common error handler - FIX: Add await here
      const responseData = await handleApiResponse(response, 'getGroupDetails', rawData);
      console.log('[groupService.getGroupDetails] After handleApiResponse:', responseData);

      // FIXED: Extract the actual group data from the message property
      const groupData = responseData.message || responseData;
      console.log('[groupService.getGroupDetails] Extracted groupData:', groupData);
      console.log('[groupService.getGroupDetails] GroupData members:', groupData.members);
      console.log('[groupService.getGroupDetails] GroupData Creator:', groupData.Creator);

      // Transform the data to ensure consistent field access
      // API returns: group_post, Events, Creator (with firstname, lastname, etc.)
      const transformedData = {
        // First, copy all the original properties
        id: groupData.id,
        title: groupData.title,
        about: groupData.about,
        created_at: groupData.created_at,

        // Handle arrays - convert null to empty arrays
        group_post: Array.isArray(groupData.group_post) ? groupData.group_post : [],
        Events: Array.isArray(groupData.Events) ? groupData.Events : [],
        members: Array.isArray(groupData.members) ? groupData.members : [],

        // Handle Creator object
        Creator: groupData.Creator && typeof groupData.Creator === 'object' ? groupData.Creator : {},

        // Add computed members_count
        members_count: Array.isArray(groupData.members) ? groupData.members.length : 0
      };

      console.log('[groupService.getGroupDetails] Transformed data:', transformedData);
      console.log('[groupService.getGroupDetails] Transformed members:', transformedData.members);
      console.log('[groupService.getGroupDetails] Transformed Creator:', transformedData.Creator);

      return transformedData;
    } catch (error) {
      console.error('[groupService.getGroupDetails] Error:', {
        message: error.message,
        type: error.type,
        status: error.status,
        data: error.data
      });

      if (error.type === GroupErrorTypes.NOT_FOUND) {
        throw new Error('Group not found or you do not have access to it.');
      }
      throw error;
    }
  },
  // Update group details
  async updateGroup(groupId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/updateGroup`, {
        method: 'PUT',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type header for PUT
        body: JSON.stringify({
          group_id: groupId,
          ...updateData
        })
      });

      const data = await handleApiResponse(response, 'updateGroup');
      return {
        success: true,
        message: data.message,
        updated_group: data.updated_group
      };
    } catch (error) {
      if (error.type === GroupErrorTypes.PERMISSION_DENIED) {
        throw new Error('You do not have permission to update this group.');
      }
      throw error;
    }
  },

  // Delete a group (FIXED to use title as expected by backend)
  async deleteGroup(groupTitle) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deleteGroup`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type header for DELETE
        body: JSON.stringify({ title: groupTitle }) // Use title, not group_id
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

  // Join a group
  async joinGroup(groupId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/joinGroup`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type header for POST
        body: JSON.stringify({ group_id: groupId })
      });

      const data = await handleApiResponse(response, 'joinGroup');
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      throw new Error('Failed to join group. Please try again.');
    }
  },

  // Leave a group
  async leaveGroup(groupId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaveGroup`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type header for POST
        body: JSON.stringify({ group_id: groupId })
      });

      const data = await handleApiResponse(response, 'leaveGroup');
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      throw new Error('Failed to leave group. Please try again.');
    }
  },

  // Create a new event
  async createEvent(eventData) {
    try {
      console.log('[groupService.createEvent] Creating event with data:', eventData);

      const response = await fetch(`${API_BASE_URL}/api/addEvent`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type header for POST
        body: JSON.stringify(eventData)
      });

      console.log('[groupService.createEvent] Response status:', response.status);

      const data = await handleApiResponse(response, 'createEvent');
      console.log('[groupService.createEvent] Response data:', data);

      return {
        success: true,
        message: data.message || 'Event created successfully',
        // Note: The API doesn't return event_id or event_url according to the docs
        // So we'll just return the success message
      };
    } catch (error) {
      console.error('[groupService.createEvent] Error:', {
        message: error.message,
        type: error.type,
        status: error.status,
        data: error.data
      });

      if (error.type === GroupErrorTypes.INVALID_INPUT) {
        throw new Error('Invalid event data provided. Please check the event details.');
      }

      if (error.status === 400) {
        throw new Error('Invalid event information. Please check all required fields.');
      }

      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to create events in this group.');
      }

      throw error;
    }
  },

  // RSVP to an event
  async rsvpEvent(eventId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rsvpEvent`, {
        method: 'POST',
        credentials: 'include',
        headers: getHeaders(true), // Include Content-Type header for POST
        body: JSON.stringify({
          event_id: eventId,
          status: status,
          timestamp: new Date().toISOString()
        })
      });

      const data = await handleApiResponse(response, 'rsvpEvent');
      return {
        success: true,
        message: data.message,
        updated_status: status
      };
    } catch (error) {
      throw new Error('Failed to update RSVP status. Please try again.');
    }
  },

  // Get event details
  async getEventDetails(eventId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getEventData?event_id=${encodeURIComponent(eventId)}`, {
        credentials: 'include',
        headers: getHeaders(false) // No CSRF token needed for GET
      });

      const data = await handleApiResponse(response, 'getEventDetails');
      return data;
    } catch (error) {
      if (error.type === GroupErrorTypes.NOT_FOUND) {
        throw new Error('Event not found or you do not have access to it.');
      }
      throw error;
    }
  }
};