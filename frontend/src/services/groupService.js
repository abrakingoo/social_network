// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const groupService = {
  // Fetch all groups
  async getAllGroups() {
    try {
      console.log('[groupService.getAllGroups] Fetching all groups...');
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });

      const data = await response.json();
      console.log('[groupService.getAllGroups] Raw response:', data);

      if (!response.ok) {
        console.error('[groupService.getAllGroups] Error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        const error = new Error(data.message || 'Failed to fetch groups');
        error.status = response.status;
        throw error;
      }
      const groups = data.message || [];
      console.log('[groupService.getAllGroups] Parsed groups:', groups);
      return groups;
    } catch (error) {
      console.error('[groupService.getAllGroups] Error:', error);
      throw error;
    }
  },

  // Create a new group
  async createGroup(groupData) {
    try {
      console.log('[groupService.createGroup] Creating group with data:', groupData);
      const response = await fetch(`${API_BASE_URL}/api/addGroup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: groupData.name,
          description: groupData.description || ''
        })
      });

      const data = await response.json();
      console.log('[groupService.createGroup] Raw response:', data);

      if (!response.ok) {
        console.error('[groupService.createGroup] Error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        if (response.status === 409) {
          const error = new Error(data.message || 'Group with this title already exists');
          error.status = response.status;
          throw error;
        }
        const error = new Error(data.message || 'Failed to create group');
        error.status = response.status;
        throw error;
      }

      const result = {
        success: true,
        message: data.message,
        data: data.data
      };
      console.log('[groupService.createGroup] Success result:', result);
      return result;
    } catch (error) {
      if (!error.message.includes('Group with this title already exists')) {
        console.error('[groupService.createGroup] Error:', error);
      }
      throw new Error(error.message || 'Failed to create group. Please try again.');
    }
  },

  // Get group details by title
  async getGroupDetails(groupTitle) {
    try {
      console.log('[groupService.getGroupDetails] Fetching details for group:', groupTitle);
      const response = await fetch(`${API_BASE_URL}/api/getGroupData?title=${encodeURIComponent(groupTitle)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('[groupService.getGroupDetails] Raw response:', data);

      if (!response.ok) {
        console.error('[groupService.getGroupDetails] Error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        const error = new Error(data.message || 'Failed to fetch group details');
        error.status = response.status;
        throw error;
      }
      console.log('[groupService.getGroupDetails] Parsed group details:', data.message);
      return data.message;
    } catch (error) {
      console.error('[groupService.getGroupDetails] Error:', error);
      throw error;
    }
  },

  // Delete a group by title
  async deleteGroup(groupTitle) {
    try {
      console.log('[groupService.deleteGroup] Deleting group:', groupTitle);
      const response = await fetch(`${API_BASE_URL}/api/deleteGroup`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ title: groupTitle })
      });

      const data = await response.json();
      console.log('[groupService.deleteGroup] Raw response:', data);

      if (!response.ok) {
        console.error('[groupService.deleteGroup] Error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        const error = new Error(data.message || 'Failed to delete group');
        error.status = response.status;
        throw error;
      }
      console.log('[groupService.deleteGroup] Success message:', data.message);
      return data.message; // Typically a success message
    } catch (error) {
      console.error('[groupService.deleteGroup] Error:', error);
      throw error;
    }
  },

  // Create a new event
  async createEvent(eventData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/addEvent`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      console.log('[groupService.createEvent] Raw response:', data);

      if (!response.ok) {
        console.error('[groupService.createEvent] Error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        const error = new Error(data.message || 'Failed to create event');
        error.status = response.status;
        throw error;
      }

      return data.message; // Assuming the new event data is in data.message
    } catch (error) {
      console.error('[groupService.createEvent] Error:', error);
      throw new Error(error.message || 'Failed to create event. Please try again.');
    }
  }
};