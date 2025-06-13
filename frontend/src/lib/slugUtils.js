// utils/slugUtils.js
// Utility functions for converting group titles to URL-safe slugs and back

/**
 * Converts a group title to a URL-safe slug
 * @param {string} title - The group title
 * @returns {string} - URL-safe slug
 */
export const titleToSlug = (title) => {
  if (!title) return '';

  return title
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Converts a URL slug back to the original title format for API calls
 * This requires fetching all groups and finding the match
 * @param {string} slug - The URL slug
 * @param {Array} groups - Array of all groups
 * @returns {string|null} - Original group title or null if not found
 */
export const slugToTitle = (slug, groups) => {
  if (!slug || !groups) return null;

  // Find group whose title converts to this slug
  const group = groups.find(group => titleToSlug(group.title) === slug);
  return group ? group.title : null;
};

/**
 * Finds a group by its slug
 * @param {string} slug - The URL slug
 * @param {Array} groups - Array of all groups
 * @returns {Object|null} - Group object or null if not found
 */
export const findGroupBySlug = (slug, groups) => {
  if (!slug || !groups) return null;

  return groups.find(group => titleToSlug(group.title) === slug) || null;
};