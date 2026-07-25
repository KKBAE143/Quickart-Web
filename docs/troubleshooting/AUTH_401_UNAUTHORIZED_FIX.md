# 401 Unauthorized Error Fix

## Issue Description

Users experiencing `401 Unauthorized` errors when accessing `/api/user/user-details` endpoint after opening the application.

### Error Message
```
GET http://localhost:8080/api/user/user-details 401 (Unauthorized)
AxiosError: Request failed with status code 401
```

## Root Causes

### 1. No Valid Access Token
The most common cause - user is not logged in or the access token has expired.

### 2. Axios Interceptor Bug (FIXED)
The token refresh interceptor was incorrectly set up as a **request** interceptor instead of a **response** interceptor, preventing automatic token refresh.

**Before (Buggy):**
```javascript
Axios.interceptors.request.use(
    (response) => { return response },
    async (error) => { /* refresh logic */ }
)
```

**After (Fixed):**
```javascript
Axios.interceptors.response.use(
    (response) => { return response },
    async (error) => { /* refresh logic */ }
)
```

## Solution

### Quick Fix
1. **Refresh the browser page** to load the fixed Axios interceptor
2. **Log in** if you don't have valid tokens
3. The app will now automatically refresh expired tokens

### Manual Check
Open browser console (F12) and check for tokens:
```javascript
localStorage.getItem('accesstoken')
localStorage.getItem('refreshToken')
```

If both return `null`, you need to log in.

## Files Modified

### 1. `client/src/utils/Axios.js`
- Line 27: Changed interceptor type from `request` to `response`
- Added null safety check: `error.response?.status`
- Enhanced error handling in `refreshAccessToken` function:
  - Clear invalid tokens
  - Auto-redirect to login on failure

### 2. `server/middleware/auth.js` (Enhanced Logging)
- Added detailed authentication flow logging
- Better JWT error handling (TokenExpiredError, JsonWebTokenError)
- More descriptive error messages

### 3. `server/controllers/user.controller.js` (Enhanced Logging)
- Added request debugging information
- Better error stack traces

## How Token Refresh Works (Now Fixed)

1. User makes a request with an expired access token
2. Server returns `401 Unauthorized`
3. **Response interceptor** catches the 401 error
4. Interceptor retrieves refresh token from localStorage
5. Sends refresh token to `/api/user/refresh-token`
6. Gets new access token
7. Retries original request with new token
8. If refresh fails, redirects to login

## Testing the Fix

1. **Log in** to the application
2. Check that `accesstoken` exists in localStorage
3. Wait for token to expire (5 hours by default, or force expire for testing)
4. Make a request to a protected endpoint
5. The token should automatically refresh without error

## Prevention

### For Developers
- Always use `response` interceptors for handling HTTP errors
- Always use `request` interceptors for modifying outgoing requests
- Add proper error handling for authentication failures
- Test token refresh flow regularly

### For Users
- Keep your browser session active
- Log in again if you encounter persistent 401 errors
- Clear browser cache if issues persist

## Related Files

- `client/src/utils/Axios.js` - HTTP client configuration
- `client/src/common/SummaryApi.js` - API endpoint definitions
- `server/middleware/auth.js` - Authentication middleware
- `server/controllers/user.controller.js` - User controller
- `server/utils/generatedAccessToken.js` - Token generation
- `server/utils/generatedRefreshToken.js` - Refresh token generation

## Environment Variables

Make sure these are set correctly:

### Client `.env`
```env
VITE_API_URL=http://localhost:8080
```

### Server `.env`
```env
SECRET_KEY_ACCESS_TOKEN=your_secret_key
SECRET_KEY_REFRESH_TOKEN=your_refresh_secret_key
```

## Debugging Steps

If 401 errors persist:

1. **Check server logs** for authentication errors
2. **Verify JWT secrets** are correctly set in server `.env`
3. **Clear localStorage** and log in again
4. **Check network tab** in browser DevTools to see request/response
5. **Verify MongoDB connection** is working
6. **Check token expiration times** in token generation functions

## Status

✅ **RESOLVED** - Axios interceptor bug fixed  
✅ Enhanced logging for better debugging  
✅ Auto-redirect to login on auth failure  

## Date Fixed
December 9, 2025

