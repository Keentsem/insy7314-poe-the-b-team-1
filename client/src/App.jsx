import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PaymentDashboard from './components/PaymentDashboard';
import { API_ENDPOINTS, getSecureFetchOptions } from './config/api';

function App() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const switchToRegister = () => setIsLoginMode(false);
  const switchToLogin = () => setIsLoginMode(true);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    // SECURITY: Token is now stored in httpOnly cookie by server
    // No need to store in localStorage (prevents XSS attacks)
  };

  const handleLogout = async () => {
    try {
      // SECURITY: Call logout endpoint to clear httpOnly cookies
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
    return (
      <PaymentDashboard user={user} onLogout={handleLogout} />
    );
  }

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
        Secure Authentication System
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
    </div>
  );
}

export default App;