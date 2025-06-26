const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class UserService {
  /**
   * Update user profile information
   * @param {Object} userData - The user data to update
   * @param {string} userData.first_name - User's first name
   * @param {string} userData.last_name - User's last name
   * @param {string} userData.email - User's email
   * @param {string} userData.date_of_birth - User's date of birth
   * @param {string} userData.nickname - User's nickname
   * @param {string} userData.about_me - User's about/bio information
   * @param {boolean} userData.is_public - Whether the profile is public
   * @returns {Promise<Object>} Response from the server
   * @throws {Error} If the request fails
   */
  async updateUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/updateUser`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Get user profile information
   * @returns {Promise<Object>} User profile data
   * @throws {Error} If the request fails
   */
  async getUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;
