# Visual Studio API Issue Resolution

## Problem
The Go Live, Saved Universes, and Connection Center features were showing "unexpected token" errors because they were trying to fetch JSON data from API endpoints (`/api/universes`, `/api/integrations`) that don't exist, resulting in HTML 404 pages being parsed as JSON.

## Fix Applied
Updated the `request()` functions in:
- `src/universes/universeRegistryStore.ts`
- `src/integrations/integrationStore.ts`

### Changes Made
1. **Better Error Detection**: Check response `content-type` header to detect HTML vs JSON
2. **Clearer Error Messages**: Display `"API endpoint not available"` instead of cryptic JSON parse errors
3. **Network Error Handling**: Catch `Failed to fetch` errors and show `"Unable to connect to API server"`

## Current Status
✅ Error handling improved
✅ Build successful
✅ Dev server running on http://localhost:5173/
⚠️ Features will show error messages instead of crashing

## Next Steps (Choose One)

### Option 1: Mock Data (Quick Development)
Add mock API responses for local development:

```typescript
// In universeRegistryStore.ts
const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'

if (MOCK_MODE && path === '/') {
  return {
    universes: [
      {
        id: 'mock-universe-1',
        name: 'Example Universe',
        description: 'A sample universe',
        versionIds: ['v1'],
        activeVersionId: 'v1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  } as T
}
```

Then add to `.env.local`:
```
VITE_MOCK_API=true
```

### Option 2: Backend API Server
Create a backend server (Node.js/Express recommended) that implements:
- `GET /api/universes` - List saved universes
- `GET /api/universes/:id/versions/:versionId` - Get universe version
- `POST /api/universes` - Save new universe
- `GET /api/integrations/accounts` - List integration accounts
- `GET /api/integrations/bindings` - List integration bindings
- `GET /api/integrations/providers` - List available providers

### Option 3: Vite Proxy (Development)
Update `vite.config.ts` to proxy API calls to an external backend:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  plugins: [react()],
})
```

## Testing
The app now runs without crashing. When you click:
- **Go Live** → Shows error: "Unable to connect to API server at /api/universes"
- **Saved Universes** → Shows error: "Unable to connect to API server at /api/universes"
- **Connection Center** → Shows error: "Unable to connect to API server at /api/integrations"

These are expected until one of the above solutions is implemented.

## User Experience
- ✅ Auth works (Clerk integration)
- ✅ Canvas works (local state)
- ✅ UI navigates smoothly
- ⚠️ Cloud features require backend (Go Live, Saved Universes, Connections)
