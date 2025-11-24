import { getApiUrl } from '../../config';

export default async (input, init) => {
  // Convert relative API URLs to absolute if needed
  const url = typeof input === 'string' && input.startsWith('/api') ? getApiUrl(input) : input;
  
  // Always include credentials for cookie handling
  const options = {
    ...init,
    credentials: init?.credentials || 'include',
  };
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
};
