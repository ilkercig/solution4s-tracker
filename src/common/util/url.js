/**
 * Utility module for generating API and WebSocket URLs
 * based on the current environment (development vs production)
 */

/**
 * Gets the Traccar server domain from environment variables
 * @returns {string} The server domain (e.g., 'xxzwadnmh.traccar.com')
 * @throws {Error} If VITE_TRACCAR_SERVER_DOMAIN is not configured
 */
const getServerDomain = () => {
  const domain = import.meta.env.VITE_TRACCAR_SERVER_DOMAIN;
  
  if (!domain) {
    throw new Error(
      'VITE_TRACCAR_SERVER_DOMAIN environment variable is not configured. ' +
      'Please set it in your .env file (e.g., VITE_TRACCAR_SERVER_DOMAIN=your-domain.com)'
    );
  }
  
  return domain;
};

/**
 * Determines if the app is running in development mode
 * @returns {boolean} True if in development, false if in production
 */
const isDevelopment = () => {
  return import.meta.env.DEV;
};

/**
 * Gets the base API URL
 * 
 * Development: Uses relative path '/api' (proxied by Vite)
 * Production: Uses full URL to Traccar server
 * 
 * @returns {string} The base API URL
 */
export const getApiUrl = () => {
  if (isDevelopment()) {
    // In development, use relative path so Vite proxy handles it
    return '/api';
  }
  
  // In production, use full URL
  const domain = getServerDomain();
  return `https://${domain}/api`;
};

/**
 * Gets the WebSocket URL
 * 
 * Development: Uses relative path '/api/socket' (proxied by Vite)
 * Production: Uses direct WebSocket connection to Traccar server
 * 
 * @returns {string} The WebSocket URL to connect to
 */
export const getSocketUrl = () => {
  if (isDevelopment()) {
    // In development, use relative path so Vite proxy handles it
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/socket`;
  }
  
  // In production, connect directly to Traccar server
  const domain = getServerDomain();
  return `wss://${domain}/api/socket`;
};

/**
 * Gets the full server URL (with protocol)
 * 
 * @returns {string} The full server URL (e.g., 'https://xxzwadnmh.traccar.com')
 */
export const getServerUrl = () => {
  if (isDevelopment()) {
    return window.location.origin;
  }
  
  const domain = getServerDomain();
  return `https://${domain}`;
};

