/**
 * Mock API Configuration for Jest Tests
 */

const API_BASE_URL = 'https://localhost:3003';

export const API_ENDPOINTS = {
  // Customer Auth endpoints
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  AUTH_REFRESH: `${API_BASE_URL}/api/auth/refresh`,

  // Employee Auth endpoints
  AUTH_EMPLOYEE_LOGIN: `${API_BASE_URL}/api/auth/employee/login`,
  AUTH_EMPLOYEE_PROFILE: `${API_BASE_URL}/api/auth/employee/profile`,

  // Customer Payment endpoints
  PAYMENTS: `${API_BASE_URL}/api/payments`,

  // Employee Payment endpoints
  PAYMENTS_EMPLOYEE_PENDING: `${API_BASE_URL}/api/payments/employee/pending`,
  PAYMENTS_EMPLOYEE_ALL: `${API_BASE_URL}/api/payments/employee/all`,
  PAYMENTS_EMPLOYEE_VERIFY: transactionId =>
    `${API_BASE_URL}/api/payments/employee/verify/${transactionId}`,
  PAYMENTS_EMPLOYEE_REJECT: transactionId =>
    `${API_BASE_URL}/api/payments/employee/reject/${transactionId}`,

  // Customer endpoints
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  CUSTOMERS_BY_ID: customerId => `${API_BASE_URL}/api/customers/${customerId}`,

  // Utility endpoints
  CSRF_TOKEN: `${API_BASE_URL}/api/csrf-token`,
  HEALTH: `${API_BASE_URL}/health`,
};

export const getSecureFetchOptions = (method = 'GET', body = null, csrfToken = null) => {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (csrfToken) {
    options.headers['X-CSRF-Token'] = csrfToken;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

export default { API_ENDPOINTS, getSecureFetchOptions };
