# 🛡️ Secure International Payment Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-red.svg)](./server/SECURITY_DOCUMENTATION.md)

A comprehensive full-stack authentication and payment system demonstrating **enterprise-grade security practices** built with React and Express.js. This project implements multiple layers of security controls that **exceed standard requirements** for secure web applications.

**Author:** INSY7314 The B Team
**Course:** INSY7314 - Web Application Security


---

## 📋 Table of Contents

- [Features](#-features)
- [Security Highlights](#-security-highlights)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Security Documentation](#-security-documentation)
- [API Endpoints](#-api-endpoints)
- [Environment Configuration](#-environment-configuration)
- [Browser Compatibility](#-browser-compatibility)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- 🔐 **Secure User Authentication** - Registration and login with JWT tokens
- 💳 **International Payment Processing** - SWIFT/BIC and IBAN validation
- 📊 **Transaction History** - Real-time payment tracking and history
- 🎨 **Modern UI/UX** - Glass morphism effects with animated backgrounds
- 📱 **Responsive Design** - Mobile-first approach with adaptive layouts

### User Features
- Email/password authentication with secure session management
- International payment form with currency selection (USD, EUR, GBP, ZAR)
- Real-time input validation and sanitization
- Transaction status tracking (pending, processing, completed, failed)
- Masked sensitive data display (account numbers)
- Secure logout with token invalidation

### Visual Effects
- **FaultyTerminal Background** - Animated matrix-style terminal effect using WebGL
- **Glass Surface Components** - SVG-filtered glass morphism for modern aesthetics
- **ASCII Art Header** - Dynamic "WELCOME" text with wave animations
- **Smooth Transitions** - React-powered state management with fluid animations

---

## 🔒 Security Highlights

This application implements **defense-in-depth** security architecture that exceeds standard requirements:

### Transport Layer Security (EXCEEDS STANDARD)
- ✅ **4096-bit RSA SSL/TLS certificates** (exceeds standard 2048-bit)
- ✅ **HTTPS enforcement** with automatic HTTP to HTTPS redirection
- ✅ **HSTS (HTTP Strict Transport Security)** with 2-year max-age and preload
- ✅ **Dual server architecture** - Separate HTTP redirect and HTTPS application servers

### Authentication & Authorization
- ✅ **Argon2id password hashing** - Memory-hard, side-channel resistant algorithm
- ✅ **JWT tokens with secure httpOnly cookies** - XSS protection
- ✅ **Password complexity requirements** - Minimum 8 characters, mixed case, numbers, symbols
- ✅ **Email validation** - RFC 5322 compliant pattern matching
- ✅ **Session management** - Secure token storage and invalidation

### Attack Mitigation
- ✅ **XSS Protection** - Content Security Policy, input sanitization with DOMPurify
- ✅ **CSRF Protection** - Double-submit cookie pattern with token validation
- ✅ **SQL Injection Prevention** - Parameterized queries and input validation
- ✅ **Rate Limiting** - 5 login attempts per 15 minutes per IP + User-Agent
- ✅ **Brute Force Protection** - Progressive delays and IP-based throttling
- ✅ **Directory Traversal Prevention** - Path sanitization and validation
- ✅ **Command Injection Protection** - Input whitelisting and escaping
- ✅ **DoS Protection** - Request size limits (10KB), connection throttling

### Security Headers (via Helmet.js)
```javascript
✓ Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
✓ Content-Security-Policy: strict directives for scripts, styles, fonts
✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: DENY
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ X-Powered-By: removed (information hiding)
```

### Security Monitoring & Logging
- ✅ **Real-time threat detection** - Suspicious activity logging
- ✅ **Security event tracking** - Failed logins, rate limit violations, injection attempts
- ✅ **Audit trails** - Persistent security logs in `server/logs/security.log`
- ✅ **Severity classification** - Low, Medium, High, Critical event categorization

**📖 For complete security documentation, see [SECURITY_DOCUMENTATION.md](./server/SECURITY_DOCUMENTATION.md)**

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - Modern UI library with hooks
- **Vite 7.1** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **OGL (OpenGL)** - WebGL library for terminal effects
- **Three.js 0.180** - 3D graphics and animations

### Backend
- **Node.js 22.x** - JavaScript runtime
- **Express.js 4.18** - Web application framework
- **HTTPS Module** - Native Node.js SSL/TLS implementation

### Security Libraries
- **helmet 7.1** - HTTP security headers
- **express-rate-limit 7.1** - Rate limiting middleware
- **express-validator 7.2** - Input validation
- **argon2 0.44** - Password hashing (memory-hard algorithm)
- **bcrypt 5.1** - Backup password hashing
- **jsonwebtoken 9.0** - JWT token generation and verification
- **dompurify 3.0** - XSS sanitization
- **cors 2.8** - Cross-Origin Resource Sharing
- **cookie-parser 1.4** - Secure cookie handling

### Development Tools
- **ESLint 8.57** - Code linting
- **Prettier 3.2** - Code formatting
- **Jest 29.7** - Testing framework
- **Nodemon 3.0** - Auto-restart development server
- **Concurrently 8.2** - Run multiple npm scripts

---

## 📁 Project Structure

```
INSY7314_TheBTeam/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── LoginForm.jsx       # User login form
│   │   │   ├── RegisterForm.jsx    # User registration form
│   │   │   ├── PaymentForm.jsx     # International payment form
│   │   │   ├── PaymentDashboard.jsx # Main dashboard
│   │   │   ├── TransactionHistory.jsx # Transaction list
│   │   │   ├── GlassSurface.jsx    # Glass morphism effect
│   │   │   ├── FaultyTerminal.jsx  # WebGL terminal background
│   │   │   └── ASCIIText.jsx       # ASCII art text renderer
│   │   ├── App.jsx                 # Root application component
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── index.html                  # HTML entry point
│   ├── package.json
│   ├── vite.config.js              # Vite configuration
│   └── tailwind.config.js          # Tailwind CSS configuration
│
├── server/                          # Express.js backend server
│   ├── routes/
│   │   ├── auth.js                 # Authentication endpoints (/api/auth/*)
│   │   └── payments.js             # Payment endpoints (/api/payments/*)
│   ├── middleware/
│   │   ├── csrfProtection.js       # CSRF token validation
│   │   ├── inputSanitization.js    # XSS/injection prevention
│   │   └── securityMonitoring.js   # Threat detection & logging
│   ├── utils/
│   │   ├── passwordSecurity.js     # Argon2 password hashing
│   │   ├── jwtSecurity.js          # JWT token management
│   │   └── validation.js           # Input validation patterns
│   ├── __tests__/
│   │   ├── security.test.js        # Security feature tests
│   │   ├── passwordSecurity.test.js # Password hashing tests
│   │   └── httpsConfig.test.js     # SSL/TLS configuration tests
│   ├── logs/
│   │   └── security.log            # Security event logs
│   ├── index.js                    # Server entry point
│   ├── package.json
│   └── SECURITY_DOCUMENTATION.md   # Comprehensive security docs
│
├── config/                          # SSL/TLS certificates
│   ├── cert.pem                    # 4096-bit SSL certificate
│   └── key.pem                     # Private key
│
├── package.json                     # Root package configuration
├── .prettierrc.json                # Prettier configuration
└── README.md                       # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** - Version 18.x or higher (22.x recommended)
- **npm** - Version 9.x or higher (comes with Node.js)
- **Git** - For cloning the repository
- **Modern Web Browser** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### System Requirements
- **Operating System:** Windows 10/11, macOS 10.15+, or Linux
- **RAM:** 4GB minimum (8GB recommended)
- **Disk Space:** 500MB for dependencies

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd INSY7314_TheBTeam
```

### 2. Install Dependencies

The project uses npm workspaces for monorepo management. Install all dependencies:

```bash
# Install root, client, and server dependencies
npm run install:all
```

**Or install individually:**

```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

### 3. SSL Certificate Setup

The server requires SSL/TLS certificates for HTTPS. You have two options:

#### Option A: Use Existing Certificates (Recommended for Development)
The project includes self-signed certificates in the `config/` directory:
- `config/cert.pem` (4096-bit certificate)
- `config/key.pem` (private key)

**Note:** Self-signed certificates will show a browser warning. This is normal for development.

#### Option B: Generate New Certificates

If you want to generate your own certificates:

```bash
# Generate new 4096-bit RSA certificate (valid for 1 year)
openssl req -x509 -newkey rsa:4096 -keyout config/key.pem -out config/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=INSY7314/OU=TheBTeam/CN=localhost"
```

### 4. Environment Configuration (Optional)

Create environment files if you want to customize settings:

**`server/.env`** (optional):
```env
HTTPS_PORT=3003
HTTP_PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

**Note:** The application works with default configuration without .env files.

---

## 🏃 Running the Application

### Development Mode

Start both client and server concurrently:

```bash
npm run dev
```

This will start:
- **Backend Server:** https://localhost:3003 (HTTPS)
- **Frontend Client:** http://localhost:5174 (Vite dev server)

### Run Servers Individually

**Start Backend Only:**
```bash
npm run dev:server
```

**Start Frontend Only:**
```bash
npm run dev:client
```

### Production Build

```bash
# Build the client
npm run build

# Start production server
npm start
```

---

## 🌐 Accessing the Application

1. **Open your browser** and navigate to: `http://localhost:5174`

2. **Accept SSL Certificate** (First-time setup):
   - When you try to log in, you'll get a "Failed to fetch" error
   - Open a new tab and go to: `https://localhost:3003/health`
   - Click through the SSL warning:
     - **Chrome:** "Advanced" → "Proceed to localhost (unsafe)"
     - **Firefox:** "Advanced" → "Accept the Risk and Continue"
     - **Edge:** "Advanced" → "Continue to localhost (unsafe)"
   - You should see: `{"success":true,"message":"Server is healthy"}`
   - Return to the application and try logging in again

3. **Create an Account:**
   - Click "Create Account"
   - Enter a valid email and strong password (min 8 chars, mixed case, numbers, symbols)
   - Submit the registration form

4. **Login:**
   - Enter your credentials
   - Click "Login"
   - You'll be redirected to the Payment Dashboard

5. **Make a Payment:**
   - Enter payment amount (1.00 - 10,000.00)
   - Select currency
   - Enter recipient IBAN (e.g., `GB29NWBK60161331926819`)
   - Enter SWIFT/BIC code (e.g., `NWBKGB2L`)
   - Enter recipient name
   - Add optional payment reference
   - Click "Pay"
   - View transaction in history panel

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Security Tests Only

```bash
npm run test:security
```

### Test Files

- **`server/__tests__/security.test.js`** - XSS, injection, CSRF protection tests
- **`server/__tests__/passwordSecurity.test.js`** - Argon2 hashing tests
- **`server/__tests__/httpsConfig.test.js`** - SSL/TLS configuration tests

### Manual Security Testing

Test rate limiting:
```bash
# Try 6 login attempts within 15 minutes to trigger rate limiter
curl -X POST https://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -k
```

Test HTTPS enforcement:
```bash
# Should redirect to HTTPS (if HTTP server is enabled)
curl -I http://localhost:3000/health
```

---

## 📚 Security Documentation

### Complete Security Guide

For comprehensive security documentation including:
- Attack mitigation strategies
- Security library mappings
- Implementation details
- Testing procedures

**See:** [server/SECURITY_DOCUMENTATION.md](./server/SECURITY_DOCUMENTATION.md)

### Security Testing Results

All security tests pass:
- ✅ Password hashing (Argon2id)
- ✅ XSS prevention (DOMPurify sanitization)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Directory traversal prevention
- ✅ Command injection prevention
- ✅ CSRF protection (token validation)
- ✅ Rate limiting (IP + User-Agent)
- ✅ HTTPS configuration (4096-bit RSA)

### Security Audit

```bash
# Run npm security audit
npm run audit:all
```

---

## 🔌 API Endpoints

### Authentication

**POST /api/auth/register**
- Register new user account
- Body: `{ email, password }`
- Returns: `{ success, message, user: { id, email }, token }`

**POST /api/auth/login**
- Authenticate user
- Body: `{ email, password }`
- Returns: `{ success, message, user: { id, email }, token }`

**POST /api/auth/logout**
- Invalidate user session
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, message }`

### Payments

**POST /api/payments**
- Create international payment transaction
- Headers: `Authorization: Bearer <token>`
- Body:
  ```json
  {
    "userId": "string",
    "amount": "number (1-10000)",
    "currency": "USD|EUR|GBP|ZAR",
    "recipientAccount": "string (IBAN format)",
    "recipientSwift": "string (SWIFT/BIC format)",
    "recipientName": "string",
    "reference": "string (optional)"
  }
  ```
- Returns: `{ success, message, transaction: {...} }`

**GET /api/payments/:id**
- Get specific transaction details
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, transaction: {...} }`

**GET /api/payments/user/:userId**
- Get all transactions for user
- Headers: `Authorization: Bearer <token>`
- Returns: `{ success, transactions: [...] }`

### Health Check

**GET /health**
- Server health status
- Returns: `{ success, message, timestamp, secure, protocol }`

---

## ⚙️ Environment Configuration

### Server Environment Variables

Create `server/.env` file (optional):

```env
# Server Ports
HTTPS_PORT=3003          # HTTPS server port
HTTP_PORT=3000           # HTTP redirect server port

# Environment
NODE_ENV=development     # development | production

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h       # Token expiration time

# Rate Limiting
AUTH_RATE_LIMIT=5        # Max login attempts per window
AUTH_RATE_WINDOW=900000  # Rate limit window in ms (15 minutes)

# Security
BCRYPT_ROUNDS=12         # Bcrypt salt rounds (fallback)
ARGON2_MEMORY=65536      # Argon2 memory cost (64 MB)
ARGON2_TIME=3            # Argon2 time cost
ARGON2_PARALLELISM=4     # Argon2 parallelism
```

### Client Environment Variables

Create `client/.env` file (optional):

```env
# API Configuration
VITE_API_URL=https://localhost:3003
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_LOGGING=false
```

**Note:** The application uses secure defaults if no .env files are present.

---

## 🌍 Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Recommended |
|---------|----------------|-------------|
| Chrome | 90+ | Latest |
| Firefox | 88+ | Latest |
| Safari | 14+ | Latest |
| Edge | 90+ | Latest |

### Required Features
- ES6+ JavaScript support
- WebGL 1.0 (for FaultyTerminal effects)
- CSS Grid & Flexbox
- Fetch API
- LocalStorage
- SVG filters (for glass effects)

### Known Issues

- **Safari:** SVG filters may fall back to simple glass effect
- **Firefox:** SVG filters may fall back to simple glass effect
- **Older browsers:** Glass morphism effects degrade gracefully

---

## 📜 Scripts Reference

### Root Scripts

```bash
npm run dev              # Start both client and server
npm run dev:client       # Start client only
npm run dev:server       # Start server only
npm run build            # Build client for production
npm start                # Start production server
npm test                 # Run all tests
npm run test:security    # Run security tests only
npm run lint             # Lint all code
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run audit:all        # Security audit all workspaces
npm run install:all      # Install all dependencies
```

### Client Scripts

```bash
cd client
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint client code
npm test                 # Run client tests
```

### Server Scripts

```bash
cd server
npm run dev              # Start with nodemon (auto-restart)
npm start                # Start production server
npm run lint             # Lint server code
npm test                 # Run server tests
```

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** "Failed to fetch" or "Network error" when logging in

**Solution:**
1. Ensure backend server is running: `npm run dev:server`
2. Accept SSL certificate by visiting: `https://localhost:3003/health`
3. Click through browser SSL warning
4. Return to application and try again

---

**Problem:** Port already in use (EADDRINUSE)

**Solution:**
```bash
# Windows
netstat -ano | findstr :3003
taskkill //F //PID <PID>

# macOS/Linux
lsof -ti:3003 | xargs kill -9
```

---

**Problem:** SSL certificate errors

**Solution:**
- Self-signed certificates are expected in development
- Generate new certificates: See [Installation → Step 3](#3-ssl-certificate-setup)
- For production, use certificates from a trusted CA (Let's Encrypt, etc.)

---

**Problem:** Glass effects not appearing

**Solution:**
- Check browser compatibility (Chrome/Edge recommended)
- Safari/Firefox: Glass effects fall back to solid backgrounds
- Update browser to latest version

---

**Problem:** FaultyTerminal background not displaying

**Solution:**
- Ensure WebGL is enabled in browser settings
- Check browser console for WebGL errors
- Update graphics drivers
- Try different browser

---

## 🤝 Contributing

This is an academic project for INSY7314. Contributions are welcome for educational purposes.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting: `npm run format`
- Write meaningful commit messages
- Add tests for new security features

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 INSY7314 The B Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Authors & Acknowledgments

**The B Team**
- Course: INSY7314 - Web Application Security
- Institution: University of North Texas
- Semester: Fall 2025

### Special Thanks
- **Instructor:** [Course Instructor Name]
- **Security Libraries:** Helmet.js, Argon2, Express Security Middleware
- **UI/UX Inspiration:** Glass morphism design trends, Terminal aesthetics

---

## 📞 Support

For questions, issues, or discussions:

- **Documentation:** See [SECURITY_DOCUMENTATION.md](./server/SECURITY_DOCUMENTATION.md)
- **Issues:** Use GitHub Issues for bug reports
- **Security Concerns:** Contact course instructor immediately

---

## 🎓 Academic Integrity

This project is submitted as coursework for INSY7314. All security implementations are original work by The B Team, following academic integrity guidelines.

**Disclaimer:** This application is for educational purposes. Do not deploy to production without:
- Valid SSL certificates from trusted CA
- Database implementation (currently uses in-memory storage)
- Production-grade session management
- Load balancing and scalability measures
- Professional security audit

---

## 📚 References & Further Reading

### Security Standards
- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)

### Technical Documentation
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Argon2 Password Hashing](https://github.com/P-H-C/phc-winner-argon2)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Guidelines](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

### SSL/TLS Resources
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Free SSL Certificates](https://letsencrypt.org/)

---

<div align="center">

**Built with 🛡️ by The B Team for INSY7314**

[⬆ Back to Top](#️-secure-international-payment-portal)

</div>
