import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PaymentDashboard from './components/PaymentDashboard';

function App() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const switchToRegister = () => setIsLoginMode(false);
  const switchToLogin = () => setIsLoginMode(true);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    // Store auth token for API calls
    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setIsLoginMode(true);
    localStorage.removeItem('authToken');
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