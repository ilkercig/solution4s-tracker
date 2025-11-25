import { getServerUrl } from './url';

/**
 * Wrapper for fetch operations to API endpoints
 * Automatically constructs the full API URL based on environment
 * Returns the response without throwing (for places that need to check response.ok)
 * 
 * @param {string} endpoint - The API endpoint path (e.g., '/api/users', '/api/devices/123')
 * @param {RequestInit} init - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} The fetch response
 * 
 * @example
 * const response = await apiFetch('/api/session');
 * if (response.ok) {
 *   const data = await response.json();
 * }
 */
export default async (endpoint, init) => {
  let url = endpoint;
  
  // Construct full URL using getServerUrl
  if (typeof endpoint === 'string' && endpoint.startsWith('/api')) {
    url = getServerUrl() + endpoint;
  }
  
  return fetch(url, init);
};
