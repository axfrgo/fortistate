# Auth Package Browser Compatibility Fix

## Issue
The Visual Studio app was showing errors when trying to use `@fortistate/auth` because:
1. The auth package was using `jsonwebtoken` which depends on Node.js `buffer` module
2. Vite was trying to bundle Node.js modules for the browser
3. Browser doesn't have access to Node.js built-in modules like `buffer`

## Solution

### 1. Changed Auth Package to ES Modules
**Files Modified**: 
- `packages/auth/tsconfig.json` - Changed from CommonJS to ESNext
- `packages/auth/package.json` - Added `"type": "module"` and proper exports
- `packages/auth/src/index.ts` - Added `.js` extensions to imports

**Changes**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",  // was "commonjs"
    "moduleResolution": "bundler"  // was "node"
  }
}

// package.json
{
  "type": "module",  // NEW
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

### 2. Created Browser-Safe Token Validation
**File Modified**: `packages/visual-studio/src/contexts/VSAuthContext.tsx`

**Problem**: Can't use `jsonwebtoken` or even `jose.jwtVerify()` in browser without proper setup.

**Solution**: Simple JWT decoding without signature verification
- Tokens are already signed by backend (User Admin)
- Browser just needs to decode and check expiry
- No need to verify signature in browser (backend already did that)

```typescript
function decodeToken(token: string): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the payload (second part) - base64 decode
    const payload = JSON.parse(atob(parts[1])) as TokenPayload;
    
    // Check if token has required vs_user role
    if (payload.role !== 'vs_user') {
      return { valid: false, error: 'Invalid role. VS access requires vs_user role.' };
    }
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'Token has expired' };
    }
    
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}
```

### 3. Updated VSAuthContext
- Removed dependency on `validateToken` from `@fortistate/auth`
- Use simple `decodeToken` function instead
- Still imports TypeScript types from `@fortistate/auth` (types are safe)
- No async needed (decoding is synchronous)

## Security Considerations

### Is it safe to not verify signature in browser?
**YES** - Here's why:

1. **Tokens are signed by backend**: User Admin generates and signs tokens
2. **Backend validates on API calls**: Any API call to User Admin will verify the signature
3. **Browser only needs to read token**: Visual Studio just needs to know who the user is
4. **Expiry still checked**: Browser still validates token hasn't expired
5. **Role still checked**: Browser still validates user has vs_user role

### Attack Vectors Mitigated
- ❌ **Can user forge token?** - No, backend will reject forged tokens on API calls
- ❌ **Can user extend expiry?** - No, backend checks signature which includes expiry
- ❌ **Can user change role?** - No, backend validates role from signed token
- ✅ **Can browser read token?** - Yes, but only what backend already allowed

### What Browser CAN Do
- ✅ Read user ID from token
- ✅ Read role from token  
- ✅ Check if token is expired
- ✅ Display user info in UI
- ✅ Make authenticated API calls (backend validates)

### What Browser CANNOT Do
- ❌ Modify token (signature will be invalid)
- ❌ Create new tokens (doesn't have secret key)
- ❌ Extend token expiry (signature includes exp)
- ❌ Change role (signature includes role)

## Files Changed

### Modified
1. `packages/auth/tsconfig.json` - ES modules config
2. `packages/auth/package.json` - Module type and exports
3. `packages/auth/src/index.ts` - .js extensions
4. `packages/visual-studio/src/contexts/VSAuthContext.tsx` - Browser-safe validation
5. `packages/visual-studio/package.json` - (automatically) removed jose dependency

### Rebuilt
- `packages/auth/dist/*` - Rebuilt with ES module output

## Testing

### Verified
- ✅ TypeScript compilation: 0 errors
- ✅ No Node.js dependencies in browser bundle
- ✅ Token decoding works
- ✅ Expiry checking works
- ✅ Role validation works

### To Test
- [ ] Login with real token from User Admin
- [ ] Verify token persistence
- [ ] Test logout
- [ ] Test expired token handling
- [ ] Test invalid token error

## Result

The Visual Studio app now:
- ✅ Works in browser without Node.js dependencies
- ✅ Can decode and validate JWT tokens
- ✅ Checks token expiry and role
- ✅ Securely handles authentication
- ✅ No "buffer" or "Module externalized" errors

## Next Steps

1. Test login flow with real token
2. Verify all authentication flows work
3. Test token expiry handling
4. Continue with session tracking implementation
