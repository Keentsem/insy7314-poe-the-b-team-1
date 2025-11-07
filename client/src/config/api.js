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
  // Customer Auth endpoints
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  AUTH_REFRESH: `${API_BASE_URL}/api/auth/refresh`,

  // Employee Auth endpoints - TASK 3
  AUTH_EMPLOYEE_LOGIN: `${API_BASE_URL}/api/auth/employee/login`,
  AUTH_EMPLOYEE_PROFILE: `${API_BASE_URL}/api/auth/employee/profile`,

  // Customer Payment endpoints
  PAYMENTS: `${API_BASE_URL}/api/payments`,

  // Employee Payment endpoints - TASK 3
  PAYMENTS_EMPLOYEE_PENDING: `${API_BASE_URL}/api/payments/employee/pending`,
  PAYMENTS_EMPLOYEE_ALL: `${API_BASE_URL}/api/payments/employee/all`,
  PAYMENTS_EMPLOYEE_VERIFY: transactionId =>
    `${API_BASE_URL}/api/payments/employee/verify/${transactionId}`,
  PAYMENTS_EMPLOYEE_SUBMIT_SWIFT: `${API_BASE_URL}/api/payments/employee/submit-swift`,

  // Invoice endpoints - TASK 3
  INVOICES_CUSTOMER: `${API_BASE_URL}/api/payments/invoices`,
  INVOICES_EMPLOYEE: `${API_BASE_URL}/api/payments/employee/invoices`,
  INVOICE_DETAILS: invoiceNumber => `${API_BASE_URL}/api/payments/invoices/${invoiceNumber}`,

  // Employee Customer endpoints
  CUSTOMERS_EMPLOYEE_ALL: `${API_BASE_URL}/api/customers/employee/all`,
  CUSTOMERS_EMPLOYEE_DETAILS: customerId => `${API_BASE_URL}/api/customers/employee/${customerId}`,
  CUSTOMERS_EMPLOYEE_STATS: `${API_BASE_URL}/api/customers/employee/stats`,

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
