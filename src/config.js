// API configuration
// In development: uses relative URLs (proxied by Vite)
// In production: uses direct Traccar server URL
export const API_URL = import.meta.env.VITE_API_URL || '';

// Helper to construct full API URLs
export const getApiUrl = (path) => {
  if (API_URL) {
    console.log('[API] Using direct URL:', `${API_URL}${path}`);
    return `${API_URL}${path}`;
  }
  console.log('[API] Using relative URL (proxy):', path);
  return path; // Relative URL for development
};

// Helper for WebSocket URLs
export const getWebSocketUrl = (path) => {
  if (API_URL) {
    // Convert https:// to wss:// or http:// to ws://
    const wsUrl = API_URL.replace(/^http/, 'ws');
    return `${wsUrl}${path}`;
  }
  // Relative WebSocket URL for development
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
};

