# Simple Authentication Plan for TnyOffice API

⚠️ **SECURITY WARNING**: This is a VERY BASIC authentication approach suitable only for prototypes. The API key is exposed in the browser's JavaScript bundle, making it visible to anyone who inspects the code. We are only accepting this security risk because:
1. The Vercel deployment has password protection enabled
2. This is a prototype, not a production application
3. The simplicity outweighs the security concerns for our current needs

## Overview

This plan outlines a simple, single-API-key authentication approach to secure all API endpoints (REST and WebSocket) for the TnyOffice prototype. Since the frontend is already protected by Vercel authentication, we only need to secure the communication between the Next.js app and the Node.js API.

## Requirements

- Single shared API key (no multi-user auth needed)
- Secure both REST endpoints and WebSocket connections
- Frontend deployed on Vercel (already protected)
- API deployed on Fly.io
- Must work across different environments (development/production)
- Simple to implement and maintain

## Authentication Strategy

### 1. Pre-shared API Key Authentication

**Approach**: Use a single, shared API key that the frontend includes in all requests to the backend.

**Major Security Limitation**: 
- The API key is exposed in the browser via `NEXT_PUBLIC_API_KEY`
- Anyone can view the key by inspecting the JavaScript source
- This is NOT secure for public-facing applications
- We rely entirely on Vercel's deployment password protection

**Implementation**:
- Generate a secure API key (32+ character random string)
- Store the API key as an environment variable on both frontend and backend
- Frontend includes the key in all requests (visible in browser!)
- Backend validates the key before processing any request

### 2. Environment Variables

**Backend (Fly.io)**:
```bash
API_KEY=your-secure-32-character-api-key-here
```

**Frontend (Vercel)**:
```bash
NEXT_PUBLIC_API_KEY=your-secure-32-character-api-key-here
```

## Implementation Steps

### Phase 1: Backend Authentication Middleware

1. **Create Authentication Middleware** (`/apps/api/src/middleware/auth.ts`):
   - Extract API key from request headers
   - Compare with environment variable
   - Return 401 if missing or invalid
   - Allow request to proceed if valid

2. **Apply Middleware to REST Endpoints**:
   - Add middleware to Express app before routes
   - Apply to all `/api/v1/*` endpoints
   - Exclude health check endpoint if needed

3. **Secure WebSocket Connections**:
   - **Socket.io**: Use `auth` middleware in connection handshake
   - **Native WebSocket**: Validate API key in connection upgrade request

### Phase 2: Frontend Integration

1. **Create API Client Helper** (`/apps/docs/lib/api/client.ts`):
   - Centralize API key injection
   - Add key to all fetch requests
   - Handle WebSocket authentication

2. **Update All API Calls**:
   - Modify `comments.ts` to use authenticated client
   - Update `DocumentList`, `DocumentViewer` components
   - Update `git-sync.ts` functions

3. **Update WebSocket Connections**:
   - Modify Automerge provider to include API key
   - Update Socket.io connection to include auth

### Phase 3: Deployment Configuration

1. **Generate Secure API Key**:
   ```bash
   openssl rand -hex 32
   ```

2. **Configure Fly.io**:
   ```bash
   fly secrets set API_KEY="your-generated-key"
   ```

3. **Configure Vercel**:
   - Add `NEXT_PUBLIC_API_KEY` to Vercel environment variables
   - Set for production environment

### Phase 4: Security Enhancements

1. **Update CORS Configuration**:
   - Change from wildcard to specific origins
   - Allow only Vercel deployment URL in production
   - Keep localhost for development

2. **Add Rate Limiting** (optional for prototype):
   - Simple in-memory rate limiter
   - Prevent API abuse

3. **Request Logging**:
   - Log failed authentication attempts
   - Monitor for suspicious activity

## Technical Implementation Details

### Backend Middleware Structure

```typescript
// /apps/api/src/middleware/auth.ts
export const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};
```

### Frontend API Client Structure

```typescript
// /apps/docs/lib/api/client.ts
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export const apiClient = {
  fetch: (url: string, options?: RequestInit) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
  },
};
```

### WebSocket Authentication

**Socket.io**:
```typescript
io.use((socket, next) => {
  const apiKey = socket.handshake.auth.apiKey;
  if (apiKey === process.env.API_KEY) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});
```

**Native WebSocket**:
```typescript
wss.on('upgrade', (request, socket, head) => {
  const apiKey = request.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  // Continue with upgrade...
});
```

## Testing Strategy

1. **Development Testing**:
   - Set API_KEY in `.env` files
   - Test all endpoints with and without key
   - Verify WebSocket connections

2. **Production Testing**:
   - Deploy to staging first
   - Test all functionality with production keys
   - Monitor logs for authentication failures

## Rollback Plan

If issues arise:
1. Remove middleware from routes
2. Deploy without authentication checks
3. Frontend will continue to send keys (no-op)
4. Fix issues and redeploy

## Security Considerations

⚠️ **CRITICAL SECURITY LIMITATIONS**:
1. **API Key is PUBLIC**: Anyone who can access the frontend can see the API key
2. **No Real Security**: This only prevents casual automated attacks
3. **Vercel Password is the ONLY Protection**: Without Vercel's deployment password, anyone could use the API

### Why This is Acceptable (For Now):
- Vercel deployment password protects the frontend
- This is a prototype with limited exposure
- The data is not highly sensitive
- Time-to-implement trumps security for this phase

### What This Prevents:
- Random bots hitting the API
- Accidental exposure if API URL leaks
- Casual unauthorized access

### What This DOESN'T Prevent:
- Anyone with frontend access using the API
- API key extraction from browser
- Replay attacks
- Any serious security threat

### Future Improvements Needed:
1. Move to server-side API calls (API key stays on server)
2. Implement proper user authentication
3. Use short-lived JWT tokens
4. Add rate limiting per user
5. Implement proper session management

## Next Steps

After implementing this basic authentication:
1. Monitor usage and security logs
2. Consider adding user-specific tokens if needed
3. Implement refresh token mechanism if long-lived sessions needed
4. Add more sophisticated rate limiting if required

## Alternative Approaches Considered

1. **JWT Tokens**: Overkill for single-key requirement
2. **OAuth**: Too complex for prototype needs
3. **Basic Auth**: Less flexible than API key approach
4. **mTLS**: Too complex for this use case

## Conclusion

This pre-shared API key approach is a **TEMPORARY SOLUTION** that provides minimal security suitable only for a password-protected prototype. 

**Remember**:
- The API key is visible to anyone who can access the frontend
- Vercel's deployment password is the ONLY real security
- This is NOT suitable for production use
- This is a conscious trade-off of security for simplicity

The approach prevents casual unauthorized access and is acceptable ONLY because the frontend itself is password-protected via Vercel's deployment settings.