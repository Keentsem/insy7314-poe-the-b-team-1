/**
 * API Configuration
 * Centralized API endpoint configuration using environment variables
 */

// Get API URL from environment variable or default to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:3003';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  AUTH_REFRESH: `${API_BASE_URL}/api/auth/refresh`,

  // Payment endpoints
  PAYMENTS: `${API_BASE_URL}/api/payments`,

  // CSRF token endpoint
  CSRF_TOKEN: `${API_BASE_URL}/api/csrf-token`,
};

/**
 * Default fetch options for secure API calls
 * - Includes credentials for httpOnly cookies
 * - Sets proper headers for CSRF protection
 */
export const getSecureFetchOptions = (method = 'GET', body = null, csrfToken = null) => {
  const options = {
    method,
    credentials: 'include', // IMPORTANT: Include httpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Required by server CSRF protection
    },
  };

  // Add CSRF token if provided (required for POST requests)
  if (csrfToken) {
    options.headers['X-CSRF-Token'] = csrfToken;
  }

  // Add body if provided
  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

/**
 * Fetch CSRF token from server
 * Should be called before making state-changing requests (POST, PUT, DELETE)
 */
export const fetchCSRFToken = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.CSRF_TOKEN, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('CSRF token fetch error:', error);
    throw error;
  }
};

export default API_BASE_URL;
