import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Formats an avatar URL by prefixing it with the backend URL if it's a relative path
 * @param {string} url - The avatar URL from the backend
 * @returns {string} - The complete URL for the avatar
 */
export const formatAvatarUrl = (url) => {
  if (!url) return null;

  // If it's already a full URL (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a UI Avatars URL, return as is
  if (url.startsWith('https://ui-avatars.com/')) {
    return url;
  }

  // Otherwise, prefix with the backend URL
  return `${API_BASE_URL}/${url}`;
};
