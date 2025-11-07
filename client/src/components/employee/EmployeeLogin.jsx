/**
 * Employee Login Component - Task 3
 * Secure login for pre-populated employee accounts
 * Features Cubes animation background for visual appeal
 */

import React, { useState } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions, fetchCSRFToken } from '../../config/api';
import Cubes from './Cubes';

const EmployeeLogin = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Invalid email format';
    if (!email.endsWith('@bank.com')) return 'Employee email must be @bank.com';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    setLoading(true);

    try {
      // SECURITY: Fetch CSRF token before login
      const csrfToken = await fetchCSRFToken();

      // Submit login request
      const response = await fetch(
        API_ENDPOINTS.AUTH_EMPLOYEE_LOGIN,
        getSecureFetchOptions('POST', {
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }, csrfToken)
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setServerError('Too many login attempts. Please wait 15 minutes and try again.');
        } else if (response.status === 401) {
          setServerError(data.message || 'Invalid email or password');
        } else {
          setServerError(data.message || 'Login failed. Please try again.');
        }
        return;
      }

      // Successful login
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setServerError('Login successful but user data missing');
      }

    } catch (error) {
      console.error('Employee login error:', error);
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0a0a1a'
    }}>
      {/* Cubes Animation Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.3
      }}>
        <Cubes
          gridSize={6}
          faceColor="#0a0a1a"
          rippleColor="#4338ca"
          border="1px solid #4338ca"
          autoAnimate={true}
          clickRipple={true}
        />
      </div>

      {/* Login Form Overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
        width: '100%',
        maxWidth: '450px',
        padding: '0 20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '2px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.2) inset',
          padding: '2.5rem'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.75rem',
              textShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
            }}>
              Employee Portal
            </h2>
            <p style={{ color: '#d1d5db', fontSize: '1rem', fontWeight: '500' }}>
              Secure access for authorized bank employees
            </p>
          </div>

          {/* Error Alert */}
          {serverError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                color: '#f87171',
                fontSize: '0.875rem'
              }}>
                {serverError}
              </div>
            )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#e5e7eb'
                  }}
                >
                  Employee Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="employee@bank.com"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(67, 56, 202, 0.3)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? '#ef4444' : 'rgba(67, 56, 202, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.email && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f87171' }}>
                    {errors.email}
                  </p>
                )}
              </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#e5e7eb'
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: errors.password ? '1px solid #ef4444' : '1px solid rgba(67, 56, 202, 0.3)',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? '#ef4444' : 'rgba(67, 56, 202, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.password && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f87171' }}>
                    {errors.password}
                  </p>
                )}
              </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: loading ? '#4b5563' : '#4338ca',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(67, 56, 202, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#3730a3';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(67, 56, 202, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#4338ca';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(67, 56, 202, 0.2)';
                  }
                }}
              >
                {loading ? 'Logging in...' : 'Login as Employee'}
              </button>
            </form>

          {/* Info Section */}
          <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'rgba(67, 56, 202, 0.1)',
              border: '1px solid rgba(67, 56, 202, 0.2)',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#e5e7eb' }}>Employee Access Only</strong>
              </p>
              <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                This portal is restricted to authorized bank employees. All access attempts are logged
                and monitored for security purposes.
              </p>
            </div>

          {/* Security Badges */}
          <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
            <span>🔒 SSL Encrypted</span>
            <span>🛡️ CSRF Protected</span>
            <span>🔐 Argon2 Hashed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
