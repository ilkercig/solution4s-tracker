import { getServerUrl } from './url';

/**
 * Wrapper for fetch operations to API endpoints that throws on error
 * Automatically constructs the full API URL based on environment
 * 
 * @param {string} input - The API endpoint path (e.g., '/api/users', '/api/devices/123')
 * @param {RequestInit} init - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} The fetch response
 * @throws {Error} If the response is not ok
 */
export default async (input, init) => {
  let url = input;
  
  // Construct full URL using getServerUrl
  if (typeof input === 'string' && input.startsWith('/api')) {
    url = getServerUrl() + input;
  }
  
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
};
