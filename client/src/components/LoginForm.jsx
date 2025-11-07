import React, { useState } from 'react';
import { API_ENDPOINTS, getSecureFetchOptions } from '../config/api';

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (!PASSWORD_REGEX.test(value)) {
          return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    if (message) setMessage('');
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      setMessage('Please fix the validation errors above');
      return;
    }

    setIsSubmitting(true);

    try {
      // SECURITY: Use secure fetch options with credentials for httpOnly cookies
      const response = await fetch(
        API_ENDPOINTS.AUTH_LOGIN,
        getSecureFetchOptions('POST', formData)
      );

      const data = await response.json();

      if (data.success) {
        setMessage('Login successful! Welcome back.');
        setFormData({ email: '', password: '' });
        if (onLoginSuccess) {
          setTimeout(() => {
            // SECURITY: Don't pass token - it's stored in httpOnly cookie
            onLoginSuccess({
              email: formData.email,
              id: data.user?.userId || data.user?.id || 'user123',
              userId: data.user?.userId || data.user?.id || 'user123',
            });
          }, 1000);
        }
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>

      {message && (
        <div className={message.includes('successful') ? 'success-message' : 'error-response'}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Email Address</label>
          <input
            type="email"
            id="login-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.email ? 'error' : ''}
            required
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.password ? 'error' : ''}
            required
          />
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        <button
          type="submit"
          className="btn"
          disabled={isSubmitting || Object.keys(errors).some(key => errors[key])}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="form-switch">
        <p>
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToRegister}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
