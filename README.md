# 🛡️ Secure International Payment Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://www.mongodb.com/)
[![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-red.svg)](./server/SECURITY_DOCUMENTATION.md)

**CI/CD Pipeline:**
[![CircleCI](https://img.shields.io/badge/CircleCI-Passing-brightgreen?logo=circleci)](https://circleci.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-success?logo=jest)](./server/__tests__)
[![Coverage](https://img.shields.io/badge/Coverage-60%25%2B-green?logo=codecov)](./CI_CD_SETUP.md)
[![SonarQube](https://img.shields.io/badge/SonarQube-Quality%20Gate-blue?logo=sonarqube)](./CI_CD_SETUP.md)

A comprehensive full-stack authentication and payment system demonstrating **enterprise-grade security practices** built with React, Express.js, and MongoDB. This project implements multiple layers of security controls that **exceed standard requirements** for secure web applications, including a complete **Employee Portal** for payment verification and management.

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
- [Employee Portal Access](#-employee-portal-access)
- [Testing](#-testing)
- [Security Documentation](#-security-documentation)
- [API Endpoints](#-api-endpoints)
- [Environment Configuration](#-environment-configuration)
- [MongoDB Setup](#-mongodb-setup)
- [DevSecOps Pipeline](#-devsecops-pipeline)
- [Browser Compatibility](#-browser-compatibility)
- [License](#-license)

---

## ✨ Features

### Core Functionality

- 🔐 **Secure User Authentication** - Dual authentication system for customers and employees
- 💳 **International Payment Processing** - SWIFT/BIC and IBAN validation with real-time verification
- 👨‍💼 **Employee Portal** - Complete payment verification and management dashboard
- 🗄️ **MongoDB Integration** - Persistent data storage with scalable database architecture
- 📊 **Transaction Management** - Real-time payment tracking with status workflows
- 🎨 **Modern UI/UX** - Glass morphism effects with animated 3D backgrounds
- 📱 **Responsive Design** - Mobile-first approach with adaptive layouts

### Customer Features

- Email/password authentication with secure session management
- International payment form with currency selection (USD, EUR, GBP, ZAR)
- Real-time input validation and sanitization
- Transaction status tracking (pending, verified, submitted_to_swift, completed, rejected, failed)
- Masked sensitive data display (account numbers, SWIFT codes)
- Transaction history with filtering and search
- Secure logout with token invalidation

### Employee Portal Features (NEW)

- **Separate Employee Authentication** - Dedicated login system with @bank.com email validation
- **Payment Verification Dashboard** - Approve or reject customer payment requests
- **Multi-Tab Interface** - View pending, verified, submitted, or all transactions
- **Bulk SWIFT Submission** - Select multiple verified payments and submit to SWIFT in batch
- **Customer Directory** - View and manage registered customers
- **Accepted Payments Archive** - Access historical approved/completed transactions
- **Real-Time Updates** - Auto-refresh every 60 seconds for pending payments
- **Search & Filters** - Advanced filtering by currency, amount range, customer, and status
- **Pagination** - Efficient handling of large transaction datasets
- **3D Animated Background** - Interactive Cubes component with ripple effects
- **Verification Notes** - Add notes when approving/rejecting payments
- **Role-Based Access Control** - Department-based permissions (Verification, Audit, Compliance, Management)

### Visual Effects

- **Cubes Background** - Interactive 3D cube grid with WebGL animations and click ripples
- **FaultyTerminal Background** - Animated matrix-style terminal effect using WebGL
- **Glass Surface Components** - SVG-filtered glass morphism for modern aesthetics
- **ASCII Art Header** - Dynamic "WELCOME" text with wave animations
- **Smooth Transitions** - React-powered state management with fluid animations
- **CardNav Component** - Responsive hamburger menu with folder-style navigation

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
- ✅ **Dual authentication system** - Separate customer and employee authentication flows
- ✅ **Role-Based Access Control (RBAC)** - Employee permissions based on department
- ✅ **Password complexity requirements** - Minimum 8 characters, mixed case, numbers, symbols
- ✅ **Email validation** - RFC 5322 compliant pattern matching with domain restrictions
- ✅ **Session management** - Secure token storage and invalidation
- ✅ **Employee email restriction** - Only @bank.com emails can access employee portal

### Attack Mitigation (ENHANCED)

- ✅ **XSS Protection** - Content Security Policy, input sanitization with DOMPurify
- ✅ **CSRF Protection** - Double-submit cookie pattern with token validation on all mutations
- ✅ **SQL/NoSQL Injection Prevention** - Parameterized queries, MongoDB operator sanitization
- ✅ **Comprehensive Input Validation** - RegEx whitelist patterns for ALL user inputs
- ✅ **Rate Limiting** - 5 login attempts per 15 minutes per IP + User-Agent
- ✅ **Account Lockout System** - 15-minute lockout after 5 failed login attempts
- ✅ **Brute Force Protection** - Progressive delays and IP-based throttling
- ✅ **Directory Traversal Prevention** - Path sanitization and validation
- ✅ **Command Injection Protection** - Input whitelisting and escaping
- ✅ **DoS Protection** - Request size limits (10KB), connection throttling

### Enhanced Input Validation (NEW)

All user inputs are validated using strict RegEx whitelist patterns:

```javascript
✓ Amount: /^([1-9][0-9]{0,3}|10000)(\.[0-9]{1,2})?$/ (1.00-10,000.00)
✓ Currency: /^(USD|EUR|GBP|ZAR)$/
✓ IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/
✓ SWIFT Code: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
✓ Email: RFC 5322 compliant pattern
✓ Password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/
✓ Employee ID: /^[a-zA-Z0-9]{6,20}$/
✓ Names: /^[a-zA-Z][a-zA-Z\s'-]{1,98}[a-zA-Z]$/
✓ Transaction ID: UUID v4 format
✓ MongoDB ObjectId: /^[a-f0-9]{24}$/
```

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
- ✅ **Employee action logging** - All payment verifications and SWIFT submissions logged

📖 **For complete security documentation, see [SECURITY_DOCUMENTATION.md](./server/SECURITY_DOCUMENTATION.md)**

---

## 🛠️ Tech Stack

### Frontend

- **React 18.2** - Modern UI library with hooks
- **Vite 7.1** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **OGL (OpenGL)** - WebGL library for terminal effects
- **Three.js 0.180** - 3D graphics and animations
- **React Icons** - Icon library for UI components
- **date-fns** - Modern date utility library

### Backend

- **Node.js 22.x** - JavaScript runtime
- **Express.js 4.18** - Web application framework
- **MongoDB 7.0** - NoSQL database for persistent storage
- **Mongoose 8.0** - MongoDB object modeling
- **HTTPS Module** - Native Node.js SSL/TLS implementation

### Security Libraries

- **helmet 7.1** - HTTP security headers
- **express-rate-limit 7.1** - Rate limiting middleware
- **express-validator 7.2** - Input validation and sanitization
- **argon2 0.44** - Password hashing (memory-hard algorithm)
- **jsonwebtoken 9.0** - JWT token generation and verification
- **dompurify 3.0** - XSS sanitization
- **cors 2.8** - Cross-Origin Resource Sharing
- **cookie-parser 1.4** - Secure cookie handling
- **csurf 1.11** - CSRF protection middleware

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
│   │   │   ├── LoginForm.jsx       # Customer login form
│   │   │   ├── RegisterForm.jsx    # Customer registration form
│   │   │   ├── PaymentForm.jsx     # International payment form
│   │   │   ├── PaymentDashboard.jsx # Customer dashboard
│   │   │   ├── TransactionHistory.jsx # Transaction list
│   │   │   ├── InvoicesView.jsx    # Invoice management
│   │   │   ├── employee/           # Employee portal components (NEW)
│   │   │   │   ├── EmployeeLogin.jsx          # Employee login with Cubes background
│   │   │   │   ├── EmployeeDashboard.jsx      # Main employee dashboard
│   │   │   │   ├── AcceptedPaymentsView.jsx   # Accepted payments archive
│   │   │   │   ├── CustomerListView.jsx       # Customer directory
│   │   │   │   └── Cubes.jsx                  # 3D animated cube background
│   │   │   ├── ui/                 # Reusable UI components
│   │   │   │   ├── AnimatedList.jsx    # List animations
│   │   │   │   ├── CardNav.jsx         # Navigation hamburger menu
│   │   │   │   ├── ConfirmDialog.jsx   # Confirmation modals
│   │   │   │   ├── FolderIcon.jsx      # Folder navigation icons
│   │   │   │   ├── LoadingSpinner.jsx  # Loading states
│   │   │   │   ├── StatusBadge.jsx     # Status indicators
│   │   │   │   └── Toast.jsx           # Toast notifications
│   │   │   ├── GlassSurface.jsx    # Glass morphism effect
│   │   │   ├── FaultyTerminal.jsx  # WebGL terminal background
│   │   │   └── ASCIIText.jsx       # ASCII art text renderer
│   │   ├── config/
│   │   │   └── api.js              # API configuration and CSRF handling
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
│   │   ├── auth.js                 # Authentication endpoints (customer + employee)
│   │   ├── payments.js             # Payment endpoints (customer + employee)
│   │   └── customers.js            # Customer management endpoints (NEW)
│   ├── middleware/
│   │   ├── csrfProtection.js       # CSRF token validation
│   │   ├── inputSanitization.js    # XSS/injection prevention
│   │   ├── securityMonitoring.js   # Threat detection & logging
│   │   ├── comprehensiveValidation.js  # RegEx whitelist validation (NEW)
│   │   ├── accountLockout.js       # Account lockout system (NEW)
│   │   └── employeeAuth.js         # Employee JWT authentication (NEW)
│   ├── models/                     # MongoDB Mongoose models (NEW)
│   │   ├── Customer.js             # Customer schema with auth methods
│   │   ├── Employee.js             # Employee schema with permissions
│   │   └── Payment.js              # Payment transaction schema
│   ├── utils/
│   │   ├── passwordSecurity.js     # Argon2 password hashing
│   │   ├── jwtSecurity.js          # JWT token management
│   │   ├── validation.js           # Input validation patterns
│   │   ├── seedData.js             # Database seeding utility (NEW)
│   │   └── seedInvoices.js         # Invoice generation utility (NEW)
│   ├── config/
│   │   └── database.js             # MongoDB connection configuration (NEW)
│   ├── __tests__/
│   │   ├── security.test.js        # Security feature tests
│   │   ├── passwordSecurity.test.js # Password hashing tests
│   │   ├── httpsConfig.test.js     # SSL/TLS configuration tests
│   │   ├── api-security.test.js    # Employee API security tests (NEW)
│   │   └── integration.test.js     # End-to-end workflow tests (NEW)
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
├── .circleci/                       # CircleCI CI/CD configuration (NEW)
│   └── config.yml                  # Pipeline definition with SonarQube
│
├── sonar-project.properties         # SonarQube configuration (NEW)
├── package.json                     # Root package configuration
├── .prettierrc.json                # Prettier configuration
└── README.md                       # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** - Version 18.x or higher (22.x recommended)
- **npm** - Version 9.x or higher (comes with Node.js)
- **MongoDB** - Version 7.0 or higher (local or MongoDB Atlas)
- **Git** - For cloning the repository
- **Modern Web Browser** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 500MB for dependencies + space for MongoDB

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/VCSTDN2024/insy7314-poe-the-b-team-1.git
cd INSY7314_TheBTeam
```

### 2. Install Dependencies

The project uses npm workspaces for monorepo management. Install all dependencies:

```bash
# Install root, client, and server dependencies
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

### 3. MongoDB Setup

You have two options for MongoDB:

#### Option A: Local MongoDB Installation

1. **Download and install MongoDB** from https://www.mongodb.com/try/download/community
2. **Start MongoDB service**:
   - **Windows**: MongoDB runs as a service automatically
   - **macOS**: `brew services start mongodb-community`
   - **Linux**: `sudo systemctl start mongod`
3. **Verify MongoDB is running**:
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/payment-portal`)
4. Update `server/.env` with your connection string (see Step 5)

### 4. SSL Certificate Setup

The server requires SSL/TLS certificates for HTTPS. You have two options:

#### Option A: Use Existing Certificates (Recommended for Development)

The project includes self-signed certificates in the `config/` directory:

- `config/cert.pem` (4096-bit certificate)
- `config/key.pem` (private key)

**Note**: Self-signed certificates will show a browser warning. This is normal for development.

#### Option B: Generate New Certificates

If you want to generate your own certificates:

```bash
# Generate new 4096-bit RSA certificate (valid for 1 year)
openssl req -x509 -newkey rsa:4096 -keyout config/key.pem -out config/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=INSY7314/OU=TheBTeam/CN=localhost"
```

### 5. Environment Configuration

Create a `server/.env` file for MongoDB connection:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/payment-portal
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payment-portal

# Server Ports
HTTPS_PORT=3003
HTTP_PORT=3000

# Environment
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Rate Limiting
AUTH_RATE_LIMIT=5
AUTH_RATE_WINDOW=900000

# Security
ARGON2_MEMORY=65536
ARGON2_TIME=3
ARGON2_PARALLELISM=4
```

### 6. Seed Database with Employee Accounts

The system includes pre-configured employee accounts for testing:

```bash
# Seed employees and customers
npm run seed

# Or manually from server directory
cd server
node utils/seedData.js
```

This creates 5 employee accounts (see [Employee Portal Access](#-employee-portal-access) section below).

---

## 🏃 Running the Application

### Development Mode

Start both client and server concurrently:

```bash
npm run dev
```

This will start:

- **Backend Server**: https://localhost:3003 (HTTPS)
- **Frontend Client**: http://localhost:5174 (Vite dev server)

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

### Customer Portal

1. **Open your browser** and navigate to: http://localhost:5174

2. **Accept SSL Certificate** (First-time setup):
   - When you try to log in, you'll get a "Failed to fetch" error
   - Open a new tab and go to: https://localhost:3003/health
   - Click through the SSL warning:
     - **Chrome**: "Advanced" → "Proceed to localhost (unsafe)"
     - **Firefox**: "Advanced" → "Accept the Risk and Continue"
     - **Edge**: "Advanced" → "Continue to localhost (unsafe)"
   - You should see: `{"success":true,"message":"Server is healthy"}`
   - Return to the application and try logging in again

3. **Create a Customer Account**:
   - Click "Create Account"
   - Enter a valid email and strong password (min 8 chars, mixed case, numbers, symbols)
   - Submit the registration form

4. **Login as Customer**:
   - Enter your credentials
   - Click "Login"
   - You'll be redirected to the Payment Dashboard

5. **Make a Payment**:
   - Enter payment amount (1.00 - 10,000.00)
   - Select currency (USD, EUR, GBP, ZAR)
   - Enter recipient IBAN (e.g., `GB29NWBK60161331926819`)
   - Enter SWIFT/BIC code (e.g., `NWBKGB2L`)
   - Enter recipient name
   - Add optional payment reference
   - Click "Pay"
   - View transaction in history panel (status: "pending")

---

## 👨‍💼 Employee Portal Access

The Employee Portal allows authorized bank employees to verify payments, submit to SWIFT, and manage customers.

### Pre-Configured Employee Accounts

After running `npm run seed`, you'll have these employee accounts:

  | Name           | Email              | Password              |
  |----------------|--------------------|-----------------------|
  | John Manager   | manager@bank.com   | Manager2025!Secure#9X |
  | Sarah Verifier | verifier1@bank.com | Verifier1@2025!Kp7    |
  | Mike Validator | verifier2@bank.com | Validator2#2025!Qw3   |
  | Emma Analyst   | analyst@bank.com   | Analyst2025@Secure!7M |
  | David Admin    | admin@bank.com     | Admin2025#Strong!5R   |

### Accessing the Employee Portal

1. **Navigate to the Employee Login**: http://localhost:5174 (click "Employee Portal" if available, or access directly)

2. **Login with Employee Credentials**:
   - Email: `verifier@bank.com` (or any employee above)
   - Password: `Secure123!`
   - Click "Login as Employee"

3. **Employee Dashboard Features**:
   - **View Pending Payments**: See all customer payments awaiting verification
   - **Approve/Reject Payments**: Click "Approve" or "Reject" with optional notes
   - **Submit to SWIFT**: Select verified payments and submit in bulk
   - **Customer Directory**: View all registered customers
   - **Accepted Payments Archive**: Access historical approved/completed transactions
   - **Search & Filter**: Find transactions by ID, customer, amount, or currency
   - **Real-Time Updates**: Dashboard auto-refreshes every 60 seconds

4. **Payment Verification Workflow**:

   ```
   Customer submits payment
         ↓
   Payment status: "pending"
         ↓
   Employee approves → status: "verified"
         ↓
   Employee submits to SWIFT → status: "submitted_to_swift"
         ↓
   SWIFT processes → status: "completed"

   (OR Employee rejects → status: "rejected")
   ```

### Employee Portal Screenshots

**Employee Login with Cubes Animation:**

- 3D animated cube grid background with ripple effects
- @bank.com email validation
- Secure employee authentication

**Employee Dashboard:**

- Multi-tab interface (Pending, Verified, Submitted to SWIFT, All)
- Search and filter controls
- Bulk SWIFT submission
- Customer directory access
- Accepted payments folder navigation

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Security tests only
npm run test:security

# Client tests with coverage
npm run test:coverage --workspace=client

# Server tests with coverage
npm run test:coverage --workspace=server

# Employee API security tests
npm test --workspace=server -- --testPathPattern=api-security

# Integration tests
npm test --workspace=server -- --testPathPattern=integration
```

### Test Files

- `server/__tests__/security.test.js` - XSS, injection, CSRF protection tests
- `server/__tests__/passwordSecurity.test.js` - Argon2 hashing tests
- `server/__tests__/httpsConfig.test.js` - SSL/TLS configuration tests
- `server/__tests__/api-security.test.js` - Employee API security tests (NEW)
- `server/__tests__/integration.test.js` - End-to-end workflow tests (NEW)
- `client/src/__tests__/` - React component tests

### Manual Security Testing

**Test rate limiting:**

```bash
# Try 6 login attempts within 15 minutes to trigger rate limiter
for i in {1..6}; do
  curl -X POST https://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -k
done
```

**Test account lockout:**

```bash
# After 5 failed attempts, account is locked for 15 minutes
node test-account-lockout.js
```

**Test HTTPS enforcement:**

```bash
# Should redirect to HTTPS (if HTTP server is enabled)
curl -I http://localhost:3000/health
```

---

## 🔌 API Endpoints

### Customer Authentication

#### Register Customer

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secure123!",
  "accountNumber": "ACC12345678"
}

Response: 201 Created
{
  "success": true,
  "message": "Customer registered successfully",
  "user": {
    "id": "64f7e3a...",
    "name": "John Doe",
    "email": "john@example.com",
    "accountNumber": "ACC12345678",
    "role": "customer"
  }
}
```

#### Login Customer

```http
POST /api/auth/login
Content-Type: application/json
X-CSRF-Token: <csrf-token>

{
  "email": "john@example.com",
  "password": "Secure123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "64f7e3a...",
    "name": "John Doe",
    "email": "john@example.com",
    "accountNumber": "ACC12345678",
    "role": "customer"
  }
}
```

### Employee Authentication (NEW)

#### Login Employee

```http
POST /api/auth/employee/login
Content-Type: application/json
X-CSRF-Token: <csrf-token>

{
  "email": "verifier@bank.com",
  "password": "Secure123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Employee login successful",
  "user": {
    "id": "64f7e3b...",
    "name": "Victor Verifier",
    "email": "verifier@bank.com",
    "employeeId": "EMP002",
    "department": "Verification",
    "role": "employee",
    "permissions": ["view_payments", "verify_payments", "view_customers"]
  }
}
```

#### Get Employee Profile

```http
GET /api/auth/employee/profile
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "success": true,
  "user": {
    "id": "64f7e3b...",
    "name": "Victor Verifier",
    "email": "verifier@bank.com",
    "employeeId": "EMP002",
    "department": "Verification",
    "role": "employee",
    "permissions": ["view_payments", "verify_payments", "view_customers"],
    "status": "active"
  }
}
```

### Customer Payments

#### Create Payment

```http
POST /api/payments
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-CSRF-Token: <csrf-token>

{
  "amount": 1500.50,
  "currency": "USD",
  "recipientAccount": "GB29NWBK60161331926819",
  "recipientSwift": "NWBKGB2L",
  "recipientName": "Jane Smith",
  "reference": "Invoice #12345"
}

Response: 201 Created
{
  "success": true,
  "message": "Payment created successfully",
  "transaction": {
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.50,
    "currency": "USD",
    "status": "pending",
    "createdAt": "2025-01-07T10:30:00.000Z"
  }
}
```

#### Get Customer Payments

```http
GET /api/payments/customer
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "success": true,
  "transactions": [
    {
      "transactionId": "550e8400-...",
      "amount": 1500.50,
      "currency": "USD",
      "recipientName": "Jane Smith",
      "status": "pending",
      "createdAt": "2025-01-07T10:30:00.000Z"
    }
  ]
}
```

### Employee Payment Management (NEW)

#### Get Pending Payments (Employee)

```http
GET /api/payments/employee/pending
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "success": true,
  "transactions": [
    {
      "transactionId": "550e8400-...",
      "customerEmail": "john@example.com",
      "amount": 1500.50,
      "currency": "USD",
      "recipientName": "Jane Smith",
      "recipientAccount": "GB29****6819",
      "recipientSwift": "NWBKGB2L",
      "status": "pending",
      "createdAt": "2025-01-07T10:30:00.000Z"
    }
  ],
  "count": 15
}
```

#### Verify Payment (Approve/Reject)

```http
POST /api/payments/employee/:transactionId/verify
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-CSRF-Token: <csrf-token>

{
  "verified": true,
  "verifierNotes": "All documentation verified"
}

Response: 200 OK
{
  "success": true,
  "message": "Payment approved successfully",
  "transaction": {
    "transactionId": "550e8400-...",
    "status": "verified",
    "verifiedBy": "verifier@bank.com",
    "verifiedAt": "2025-01-07T11:00:00.000Z"
  }
}
```

#### Submit to SWIFT (Bulk)

```http
POST /api/payments/employee/submit-swift
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-CSRF-Token: <csrf-token>

{
  "transactionIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}

Response: 200 OK
{
  "success": true,
  "message": "2 transaction(s) submitted to SWIFT successfully",
  "results": {
    "successful": ["550e8400-...", "660e8400-..."],
    "failed": []
  }
}
```

#### Get All Payments (Employee)

```http
GET /api/payments/employee/all?status=verified&page=1&limit=20
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "success": true,
  "transactions": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Customer Management (NEW)

#### Get All Customers (Employee Only)

```http
GET /api/customers
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "success": true,
  "customers": [
    {
      "id": "64f7e3a...",
      "name": "John Doe",
      "email": "john@example.com",
      "accountNumber": "ACC12345678",
      "accountType": "checking",
      "accountBalance": 5000.00,
      "status": "active",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "transactionCount": 5
    }
  ],
  "count": 42
}
```

### General

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Health Check

```http
GET /health

Response: 200 OK
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-01-07T12:00:00.000Z",
  "secure": true,
  "protocol": "https"
}
```

#### CSRF Token

```http
GET /api/csrf-token

Response: 200 OK
{
  "success": true,
  "csrfToken": "a1b2c3d4-..."
}
```

---

## ⚙️ Environment Configuration

### Server Environment Variables

Create `server/.env` file:

```env
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/payment-portal
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payment-portal

# Server Ports
HTTPS_PORT=3003
HTTP_PORT=3000

# Environment
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production-minimum-32-characters-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
AUTH_RATE_LIMIT=5          # Max login attempts per window
AUTH_RATE_WINDOW=900000    # 15 minutes in milliseconds

# Account Lockout
LOCKOUT_THRESHOLD=5        # Failed attempts before lockout
LOCKOUT_DURATION=900000    # 15 minutes lockout

# Security
ARGON2_MEMORY=65536        # 64 MB
ARGON2_TIME=3              # Time cost
ARGON2_PARALLELISM=4       # Parallelism factor

# Logging
LOG_LEVEL=info             # debug | info | warn | error
```

### Client Environment Variables

Create `client/.env` file (optional):

```env
# API Configuration
VITE_API_URL=https://localhost:3003
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_LOGGING=false
VITE_ENABLE_ANIMATIONS=true
```

**Note:** The application uses secure defaults if no `.env` files are present.

---

## 🗄️ MongoDB Setup

### Database Structure

The application uses MongoDB with the following collections:

#### Customers Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  passwordHash: String,
  accountNumber: String (unique),
  accountType: String (checking, savings),
  accountBalance: Number,
  status: String (active, suspended, closed),
  failedLoginAttempts: Number,
  lastFailedLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Employees Collection

```javascript
{
  _id: ObjectId,
  employeeId: String (unique, indexed),
  name: String,
  email: String (unique, indexed, @bank.com only),
  passwordHash: String,
  department: String (Verification, Audit, Compliance, Management),
  status: String (active, inactive),
  permissions: [String],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments Collection

```javascript
{
  _id: ObjectId,
  transactionId: String (UUID v4, unique, indexed),
  customerId: ObjectId (ref: Customer),
  customerEmail: String (indexed),
  amount: Number,
  currency: String (USD, EUR, GBP, ZAR),
  recipientAccount: String,
  recipientSwift: String,
  recipientName: String,
  reference: String (optional),
  status: String (pending, verified, rejected, submitted_to_swift, completed, failed),
  verifiedBy: String (employee email),
  verifiedAt: Date,
  verifierNotes: String,
  submittedToSwiftBy: String,
  submittedToSwiftAt: Date,
  swiftReference: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Customers
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ accountNumber: 1 }, { unique: true });

// Employees
db.employees.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ employeeId: 1 }, { unique: true });

// Payments
db.payments.createIndex({ transactionId: 1 }, { unique: true });
db.payments.createIndex({ customerId: 1 });
db.payments.createIndex({ customerEmail: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ createdAt: -1 });
```

### Seeding Data

To populate the database with test data:

```bash
# Seed employees and customers
npm run seed

# Seed invoices (optional)
npm run seed:invoices

# Or run manually
cd server
node utils/seedData.js
node utils/seedInvoices.js
```

This creates:

- 5 employee accounts (see [Employee Portal Access](#-employee-portal-access))
- Sample customer accounts
- Sample payment transactions in various statuses

### MongoDB Connection Troubleshooting

**Problem:** "MongoServerError: Authentication failed"

**Solution:**

- Check your `MONGODB_URI` credentials
- Ensure user has read/write permissions
- For Atlas: Whitelist your IP address in Network Access

**Problem:** "MongooseServerSelectionError: connect ECONNREFUSED"

**Solution:**

- Ensure MongoDB is running: `mongosh` to test connection
- Check connection string format
- Verify port 27017 is not blocked by firewall

---

## 🔄 DevSecOps Pipeline

### Overview

This project implements a comprehensive DevSecOps pipeline that automatically tests, scans, and validates code for security vulnerabilities on every commit.

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Git Push to GitHub                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Install Dependencies (2 min)               │
└─────────┬────────────┬────────────┬─────────────────────┘
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌──────────┐  ┌────────┐
    │  Lint   │  │ Security │  │ Tests  │
    │ (30s)   │  │  Audit   │  │(1-2min)│
    └─────────┘  │  (30s)   │  └───┬────┘
                 └──────────┘      │
                                   ▼
                           ┌───────────────┐
                           │  SonarQube    │
                           │  Scan (1-2min)│
                           └───────┬───────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │  API Tests    │
                           │    (1 min)    │
                           └───────┬───────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │     Build     │
                           │    (1 min)    │
                           └───────┬───────┘
                                   │
                                   ▼
                           ┌───────────────┐
                           │    Deploy     │
                           │    (10s)      │
                           └───────────────┘
```

### Quality Gates

| Check          | Requirement                 | Status       |
| -------------- | --------------------------- | ------------ |
| Linting        | No ESLint errors            | ✅ Enforced  |
| Tests          | All tests pass              | ✅ Enforced  |
| Coverage       | ≥ 60% code coverage         | ✅ Enforced  |
| Security Audit | No critical vulnerabilities | ⚠️ Monitored |
| SonarQube      | Quality Gate Pass           | ✅ Enforced  |
| API Tests      | All endpoint tests pass     | ✅ Enforced  |

### CI/CD Tools

- **CircleCI**: Automated build and test pipeline
- **SonarQube/SonarCloud**: Static Application Security Testing (SAST)
- **npm audit**: Software Composition Analysis (SCA)
- **Jest**: Unit and integration testing
- **ESLint**: Code quality and security linting

### Setup Instructions

See detailed setup guide: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

Quick setup:

1. Connect GitHub repo to CircleCI
2. Add `SONAR_TOKEN` environment variable to CircleCI
3. Configure SonarCloud project
4. Push code to trigger pipeline

### Running CI/CD Locally

```bash
# Run all CI checks
npm run ci:all

# Individual checks
npm run ci:lint      # Linting and formatting
npm run ci:test      # Tests with coverage
npm run ci:audit     # Security audit
npm run ci:build     # Production build
```

---

## 🌍 Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Recommended |
| ------- | --------------- | ----------- |
| Chrome  | 90+             | Latest      |
| Firefox | 88+             | Latest      |
| Safari  | 14+             | Latest      |
| Edge    | 90+             | Latest      |

### Required Features

- ES6+ JavaScript support
- WebGL 1.0 (for FaultyTerminal and Cubes effects)
- CSS Grid & Flexbox
- Fetch API
- LocalStorage
- SVG filters (for glass effects)
- CSS Custom Properties

### Known Issues

- **Safari**: SVG filters may fall back to simple glass effect
- **Firefox**: SVG filters may fall back to simple glass effect
- **Older browsers**: Glass morphism and 3D effects degrade gracefully

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
npm run test:coverage    # Run tests with coverage
npm run lint             # Lint all code
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run audit:all        # Security audit all workspaces
npm run install:all      # Install all dependencies
npm run seed             # Seed database with test data
npm run seed:invoices    # Generate invoice data
npm run ci:all           # Run all CI checks locally
```

### Client Scripts

```bash
cd client
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint client code
npm test                 # Run client tests
npm run test:coverage    # Run tests with coverage
```

### Server Scripts

```bash
cd server
npm run dev              # Start with nodemon (auto-restart)
npm start                # Start production server
npm run lint             # Lint server code
npm test                 # Run server tests
npm run test:coverage    # Run tests with coverage
```

---

## 🐛 Troubleshooting

### Common Issues

#### Problem: "Failed to fetch" or "Network error" when logging in

**Solution:**

1. Ensure backend server is running: `npm run dev:server`
2. Accept SSL certificate by visiting: https://localhost:3003/health
3. Click through browser SSL warning
4. Return to application and try again

#### Problem: Port already in use (EADDRINUSE)

**Solution:**

```bash
# Windows
netstat -ano | findstr :3003
taskkill //F //PID <PID>

# macOS/Linux
lsof -ti:3003 | xargs kill -9
```

#### Problem: MongoDB connection errors

**Solution:**

1. Ensure MongoDB is running: `mongosh` to test
2. Check `MONGODB_URI` in `server/.env`
3. Verify connection string format
4. For Atlas: Check network access whitelist

#### Problem: SSL certificate errors

**Solution:**

1. Self-signed certificates are expected in development
2. Generate new certificates: See [Installation → Step 4](#4-ssl-certificate-setup)
3. For production, use certificates from a trusted CA (Let's Encrypt)

#### Problem: Employee login fails with "Input validation failed"

**Solution:**

1. Ensure you're using an @bank.com email address
2. Password must meet complexity requirements (8+ chars, mixed case, numbers, symbols)
3. Check server logs for detailed error messages

#### Problem: Glass effects or 3D backgrounds not appearing

**Solution:**

1. Check browser compatibility (Chrome/Edge recommended)
2. Ensure WebGL is enabled in browser settings
3. Update graphics drivers
4. Safari/Firefox: Effects may fall back to solid backgrounds (expected behavior)

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
- Document new API endpoints

---

## 📝 License

This project is licensed under the MIT License.

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

- **Course**: INSY7314 - Web Application Security
- **Institution**: Varsity College Sandton
- **Semester**: 2025 Semester 1

### Special Thanks

- **Instructor**: Itumeleng Molokomme
- **Security Libraries**: Helmet.js, Argon2, Express Security Middleware
- **UI/UX Inspiration**: Glass morphism design trends, Terminal aesthetics, Modern fintech interfaces
- **MongoDB**: For providing excellent database documentation and Atlas free tier

---

## 📞 Support

For questions, issues, or discussions:

- **Documentation**: See [SECURITY_DOCUMENTATION.md](./server/SECURITY_DOCUMENTATION.md)
- **Issues**: Use GitHub Issues for bug reports
- **Security Concerns**: Contact course instructor immediately
- **CI/CD Setup**: See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

---

## 🎓 Academic Integrity

This project is submitted as coursework for INSY7314. All security implementations are original work by The B Team, following academic integrity guidelines.

### Disclaimer

This application is for **educational purposes only**. Do not deploy to production without:

1. ✅ Valid SSL certificates from trusted CA (Let's Encrypt, DigiCert)
2. ✅ Production-grade MongoDB cluster with replication
3. ✅ Environment-specific configuration management
4. ✅ Load balancing and scalability measures
5. ✅ Professional security audit and penetration testing
6. ✅ Monitoring and alerting infrastructure (Datadog, New Relic)
7. ✅ Backup and disaster recovery plan
8. ✅ Compliance certifications (PCI DSS, GDPR, SOC 2)

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
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### SSL/TLS Resources

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Free SSL Certificates](https://letsencrypt.org/)

### DevSecOps

- [CircleCI Documentation](https://circleci.com/docs/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)

---

**Built with 🛡️ by The B Team for INSY7314**

_Last Updated: January 2025_
