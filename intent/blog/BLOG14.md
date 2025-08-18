# Building TnyOffice: Security Reality Check

## Part 14: When "It's Just a Prototype" Meets Real Data

*July 20, 2025, 8:15 PM EDT*

Saturday evening brought a sobering realization: "look at @apps/api/ and @apps/api/README.md then start making a plan in api/plans/simple_auth.md for how we can implement the simplest approach to protect all of our API endpoints."

The context was crucial: "it's a prototype but it'll have some of our real data in it so we dont want it open on the internet."

## The Security Audit

Claude's analysis revealed the uncomfortable truth:

**Current Security State:**
- No authentication middleware - API completely open
- No API keys or tokens required
- CORS enabled with wildcard - accepts requests from any origin
- No rate limiting
- Git sync accepts any remote URL
- WebSocket connections have no authentication

Anyone could:
- Create, read, update, delete any document
- Add or remove comments
- Trigger git syncs to any repository
- Connect to WebSockets and receive all updates

The prototype had evolved beyond a demo. It needed protection.

## The Requirements

The constraints shaped the solution:
- "We don't need multi-user auth or anything like that"
- Frontend on Vercel (already protected by Vercel auth)
- API on Fly.io (completely exposed)
- Just need to secure communication between frontend and backend
- Keep it simple but effective

## The Simple Auth Plan

The solution that emerged was beautifully minimal: **Single API Key Authentication**

```typescript
// Backend validates
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// Frontend sends
fetch(url, {
  headers: { 'x-api-key': process.env.NEXT_PUBLIC_API_KEY }
});
```

One key. Shared secret. Problem solved.

## The Implementation

"begin implementing this plan"

What followed was methodical implementation:

### 1. Authentication Middleware
```typescript
export const authenticateRequest = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Skip in dev if no key set (developer friendly)
  if (process.env.NODE_ENV === 'development' && !expectedKey) {
    logger.warn('API_KEY not set in development mode - skipping');
    return next();
  }
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`Authentication failed from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};
```

### 2. Apply to All Routes
```typescript
// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Everything else needs auth
app.use('/api/v1', authenticateRequest);
```

### 3. WebSocket Security
Both Socket.io and native WebSocket connections needed protection:

```typescript
// Socket.io
io.use((socket, next) => {
  const apiKey = socket.handshake.auth.apiKey;
  if (apiKey === process.env.API_KEY) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});
```

## The Developer Experience

The implementation revealed thoughtful touches:

1. **Development Flexibility**: Skip auth in dev if no key set
2. **Clear Logging**: Track failed attempts with IP addresses
3. **Helpful Errors**: Distinguish between missing and invalid keys
4. **Health Check**: Keep one endpoint open for monitoring

## The Deployment Strategy

```bash
# Generate secure key
openssl rand -hex 32

# Set on Fly.io
fly secrets set API_KEY="your-key"

# Set on Vercel
# Add NEXT_PUBLIC_API_KEY in dashboard
```

Simple commands, immediate security.

## The Philosophy

This session exemplified TnyOffice's approach to complexity:

1. **Identify the actual need** (protect real data)
2. **Find the simplest solution** (shared API key)
3. **Implement thoughtfully** (dev-friendly, production-secure)
4. **Document clearly** (comprehensive plan before code)

No JWT complexity. No OAuth flows. No user management. Just enough security for the actual requirement.

## The Lesson

Saturday evening, 8:15 PM. After a day of building advanced features—real-time collaboration, comments, git integration—the focus shifted to fundamentals: Don't leave your API open on the internet.

The solution took less than an hour to implement but would prevent countless potential problems. Sometimes the most important code is the simplest.

## The Security Mindset

This session marked a transition. TnyOffice was no longer just a prototype to demonstrate ideas. It would hold real data, face the real internet, need real security.

The implementation was minimal but the mindset shift was significant: Every feature from now on would need to consider authentication, authorization, and security.

The weekend project was growing up.

*To be continued...*

---

*Next: Sunday brings reflection, documentation, and preparation for the week ahead.*