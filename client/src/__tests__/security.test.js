import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

describe('Client-Side Security Tests', () => {
  describe('LoginForm Validation', () => {
    test('should validate email format using RFC-5322 regex', async () => {
      const mockSwitchToRegister = jest.fn();
      render(<LoginForm onSwitchToRegister={mockSwitchToRegister} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();
    });

    test('should validate password complexity', async () => {
      const mockSwitchToRegister = jest.fn();
      render(<LoginForm onSwitchToRegister={mockSwitchToRegister} />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();
    });

    test('should prevent submission with invalid data', () => {
      const mockSwitchToRegister = jest.fn();
      render(<LoginForm onSwitchToRegister={mockSwitchToRegister} />);

      const form = screen.getByRole('button', { name: /login/i }).closest('form');
      const submitButton = screen.getByRole('button', { name: /login/i });

      expect(submitButton).toBeDisabled();

      fireEvent.submit(form);

      expect(screen.queryByText(/login successful/i)).not.toBeInTheDocument();
    });
  });

  describe('RegisterForm Validation', () => {
    test('should validate email using RFC-5322 compliant regex', async () => {
      const mockSwitchToLogin = jest.fn();
      render(<RegisterForm onSwitchToLogin={mockSwitchToLogin} />);

      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(emailInput, { target: { value: 'test@invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('should enforce password complexity requirements', async () => {
      const mockSwitchToLogin = jest.fn();
      render(<RegisterForm onSwitchToLogin={mockSwitchToLogin} />);

      const passwordInput = screen.getByLabelText(/^password$/i);

      const testCases = [
        'password',
        'PASSWORD',
        'Password',
        'Pass1',
        'Password1'
      ];

      for (const password of testCases) {
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.blur(passwordInput);

        await waitFor(() => {
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });
      }
    });

    test('should validate password confirmation matches', async () => {
      const mockSwitchToLogin = jest.fn();
      render(<RegisterForm onSwitchToLogin={mockSwitchToLogin} />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'Password123!@#' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!@#' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    test('should accept valid password meeting all requirements', async () => {
      const mockSwitchToLogin = jest.fn();
      render(<RegisterForm onSwitchToLogin={mockSwitchToLogin} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!@#' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePass123!@#' } });

      fireEvent.blur(emailInput);
      fireEvent.blur(passwordInput);
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/password must/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Input Sanitization', () => {
    test('should handle potentially malicious input safely', async () => {
      const mockSwitchToLogin = jest.fn();
      render(<RegisterForm onSwitchToLogin={mockSwitchToLogin} />);

      const emailInput = screen.getByLabelText(/email/i);

      const maliciousInputs = [
        '<script>alert("xss")</script>@example.com',
        'test@example.com<img src=x onerror=alert(1)>',
        'javascript:alert(1)@example.com'
      ];

      for (const input of maliciousInputs) {
        fireEvent.change(emailInput, { target: { value: input } });
        fireEvent.blur(emailInput);

        await waitFor(() => {
          expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        });
      }
    });
  });
});