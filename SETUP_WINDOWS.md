# 🪟 Windows Setup Guide

Quick setup guide for Windows users.

## ✅ Verification: Check if .env already exists

The `.env` file may already be created. Check with:

```cmd
dir client\.env
```

If you see the file listed, you're all set! Skip to [Running the Application](#-running-the-application).

## 📝 Create .env files (if needed)

### Client .env file

```cmd
cd client
copy .env.example .env
```

### Server .env file

```cmd
cd server
copy .env.example .env
```

**Note:** The `.env` files are already configured with default values. No changes needed for development.

## 🚀 Running the Application

```cmd
# From the project root
npm run dev
```

This starts:
- **Backend:** https://localhost:3003
- **Frontend:** http://localhost:5174

## 🌐 First-Time Browser Setup

1. Open browser to: http://localhost:5174
2. Try to login (will fail with "Failed to fetch")
3. Open new tab: https://localhost:3003/health
4. Accept SSL certificate warning:
   - Click "Advanced" → "Proceed to localhost (unsafe)"
5. Return to app and login again

## 🐛 Common Windows Issues

### Issue: `cp` command not found
**Solution:** Use `copy` instead of `cp`:
```cmd
copy .env.example .env
```

### Issue: Port already in use
**Solution:**
```cmd
# Find process using port 3003
netstat -ano | findstr :3003

# Kill the process (replace <PID> with actual number)
taskkill /F /PID <PID>
```

### Issue: SSL certificate errors
**Solution:**
- This is normal for self-signed certificates in development
- Follow the browser setup steps above

### Issue: PowerShell execution policy
**Solution:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## 🎯 Quick Test

After setup, test the security improvements:

1. **Login** with credentials
2. **Open DevTools** (F12)
3. **Go to Application tab** → Cookies → `https://localhost:3003`
4. **Verify** you see:
   - ✅ `accessToken` cookie with `HttpOnly` flag
   - ✅ `refreshToken` cookie with `HttpOnly` flag
   - ✅ No token in localStorage (Application → Local Storage should be empty)

5. **Go to Network tab**
6. **Submit a payment**
7. **Click the payment request** in Network tab
8. **Check Headers** → Request Headers
9. **Verify** you see:
   - ✅ `X-CSRF-Token` header
   - ✅ `X-Requested-With: XMLHttpRequest` header

## 📚 More Help

See main [README.md](./README.md) for complete documentation.
