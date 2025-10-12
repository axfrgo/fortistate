# 🔐 Quick Login Guide

## How to Login to Super Admin Dashboard

### Step 1: Navigate to Login Page
Open your browser and go to:
```
http://localhost:4200
```

This will automatically redirect you to:
```
http://localhost:4200/login
```

### Step 2: Enter Secret Key
Use this secret key to login:
```
dev-secret-key-change-in-production-please
```

### Step 3: Access Dashboard
After successful login, you'll be redirected to:
```
http://localhost:4200/dashboard
```

---

## 🔑 Authentication Details

**Secret Key Location**: `.env` file  
**Variable Name**: `SUPER_ADMIN_SECRET_KEY`  
**Current Value**: `dev-secret-key-change-in-production-please`

**IP Whitelist**: `127.0.0.1, ::1` (localhost)  
**Session Duration**: 8 hours (28800 seconds)  
**JWT Secret**: Auto-configured

---

## ✅ What Happens After Login

1. **JWT Token Created**: Server generates a session token
2. **Cookie Set**: Token stored in `admin_session` httpOnly cookie
3. **Redirect**: Automatically sent to `/dashboard`
4. **All API Calls**: Now authenticated with the JWT cookie

---

## 🛠️ Troubleshooting

### Error: "Invalid secret key"
- **Solution**: Use exact secret key: `dev-secret-key-change-in-production-please`
- **Check**: `.env` file has `SUPER_ADMIN_SECRET_KEY` variable

### Error: "Access denied. IP not whitelisted"
- **Solution**: Add your IP to whitelist in `.env`
- **Variable**: `ADMIN_WHITELIST_IPS`
- **Default**: `127.0.0.1,::1` (should work for localhost)

### Error: "Session expired"
- **Solution**: Login again (session lasts 8 hours)
- **Cookie**: Check browser has `admin_session` cookie

### 401 Unauthorized on API calls
- **Solution**: Login first at `/login`
- **Check**: Browser has `admin_session` cookie
- **Test**: Refresh page after login

---

## 🎯 Quick Test

1. **Open**: http://localhost:4200
2. **Login**: `dev-secret-key-change-in-production-please`
3. **Verify**: Should see dashboard with 11 modules
4. **Test**: Click "Users" → Should see 4 users from database

---

## 🔒 Security Notes

**Development Mode**:
- Simple secret key authentication
- IP whitelist: localhost only
- 8-hour sessions
- httpOnly cookies (prevents XSS)

**Production Mode** (TODO):
- Strong secret key (32+ characters)
- Real IP whitelist
- MFA (2FA) support
- Rate limiting
- Audit logging

---

## 📝 Next Steps

After login, you can:
- View all 11 dashboard modules
- See real data from SQLite database
- Test all API endpoints
- Manage users, organizations, universes
- Track revenue, AI usage, security events

**All endpoints require authentication!** Always login first.
