import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PaymentDashboard from './components/PaymentDashboard';
import EmployeeLogin from './components/employee/EmployeeLogin';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import { API_ENDPOINTS, getSecureFetchOptions } from './config/api';
import { ToastContainer } from './components/ui';

// Customer Portal Component
function CustomerPortal() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const switchToRegister = () => setIsLoginMode(false);
  const switchToLogin = () => setIsLoginMode(true);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, getSecureFetchOptions('POST'));
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setIsLoginMode(true);
    }
  };

  if (isLoggedIn && user) {
    return <PaymentDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
        Secure Payment Portal
      </h1>

      {isLoginMode ? (
        <LoginForm onSwitchToRegister={switchToRegister} onLoginSuccess={handleLoginSuccess} />
      ) : (
        <RegisterForm onSwitchToLogin={switchToLogin} />
      )}

      <div style={{
        textAlign: 'center',
        marginTop: '1rem',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        🔒 SSL/TLS Encrypted • 🛡️ Input Validated • 🔐 Password Hashed
      </div>

      {/* Link to Employee Portal */}
      <div style={{
        textAlign: 'center',
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Are you a bank employee?
        </p>
        <Link
          to="/employee"
          style={{
            color: '#4338ca',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}
        >
          Access Employee Portal →
        </Link>
      </div>
    </div>
  );
}

// Employee Portal Component
function EmployeePortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employee, setEmployee] = useState(null);

  const handleLoginSuccess = (employeeData) => {
    setIsLoggedIn(true);
    setEmployee(employeeData);
  };

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, getSecureFetchOptions('POST'));
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setEmployee(null);
    }
  };

  if (isLoggedIn && employee) {
    return <EmployeeDashboard employee={employee} onLogout={handleLogout} />;
  }

  return <EmployeeLogin onLoginSuccess={handleLoginSuccess} />;
}

// Main App Component with Routing
function App() {
  return (
    <BrowserRouter>
      {/* Global Toast Notifications */}
      <ToastContainer />

      <Routes>
        <Route path="/" element={<CustomerPortal />} />
        <Route path="/employee" element={<EmployeePortal />} />
        <Route path="*" element={
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '4rem', color: '#4338ca', marginBottom: '1rem' }}>404</h1>
            <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
              Page not found
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                to="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4338ca',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Customer Portal
              </Link>
              <Link
                to="/employee"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Employee Portal
              </Link>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;