# Building TnyOffice: The Deployment Dance

## Part 9: WebSockets Meet the Cloud

*July 20, 2025, 7:56 AM EDT*

"we have an api in @apps/api/ directory of this monorepo that's running perfectly in local dev. it now adds websockets. the old version of this api is deployed and running nicely at fly.io. now it's time to update our deployment and get this new version up on fly, replacing the old one."

The real-time collaboration worked locally. Now came the real test: deployment.

## The TypeScript Reckoning

Before any deployment could happen, the build had to work:

```
npm run build

src/automerge/document-service.ts:32:7 - error TS2740: Type 'Promise<DocHandle<MarkdownDocument>>' is missing the following properties...
src/automerge/document-service.ts:40:13 - error TS2540: Cannot assign to 'content' because it is a read-only property...
src/automerge/sqlite-adapter.ts:8:11 - error TS2702: 'Database' only refers to a type, but is being used as a namespace...
```

Eleven errors. The code worked perfectly with `npm run dev`, but TypeScript's strict compilation caught every type mismatch:

- `repo.find()` returned a Promise, not a DocHandle
- Automerge documents used read-only proxies
- Better-sqlite3's Statement types were imported wrong
- WebSocket type compatibility issues

Claude methodically fixed each:
```typescript
// Before
handle = repo.find<MarkdownDocument>(file.automerge_id);

// After  
handle = await repo.find<MarkdownDocument>(file.automerge_id);

// Before
handle.change((doc: Doc<MarkdownDocument>) => {
  doc.content = file.content;
});

// After - let TypeScript infer the mutable proxy
handle.change((doc) => {
  doc.content = file.content;
});
```

Build successful.

## The Fly.io Configuration

The fly.toml needed WebSocket support. Claude added a new services section:

```toml
[[services]]
  internal_port = 3001
  protocol = "tcp"
  auto_stop_machines = false  # Keep running for WebSockets
  auto_start_machines = true
  min_machines_running = 1    # Always have one instance

  [[services.ports]]
    handlers = ["http"]
    port = "80"
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = "443"
```

## The Deployment Attempt

```bash
fly deploy
```

The build succeeded. The image was created. Then:

```
Failed to update machines: Services [1] Ports [0] Force https force_https is not allowed when the tls handler is enabled
```

The configuration conflict. You can't force HTTPS on a port that already handles TLS. Quick fix—separate the handlers.

## The Nuclear Option

"ok. some weird problems killing the old vm. I just deleted the tny-office-api app in the fly dashboard. help me deploy it from scratch again"

Sometimes the cleanest solution is to start fresh. The new deployment strategy:

1. Create new Fly app
2. Create persistent volume for SQLite
3. Deploy with WebSocket configuration
4. Configure environment variables

## The WebSocket Connection Issue

Deployment succeeded. The API was live. But then:

```
WebSocket connection to 'ws://localhost:3001/automerge-sync' failed
```

The frontend was still trying to connect to localhost! The issue was simple but critical—the WebSocket URL wasn't configured:

```bash
# Added to .env.local
NEXT_PUBLIC_WS_URL=wss://tny-office-api.fly.dev/automerge-sync
```

## The Documentation Update

With everything working, the README needed to reflect reality:

**Before:**
- "A monorepo containing multiple Next.js applications"
- No deployment instructions
- No mention of WebSockets

**After:**
- "Real-time collaborative markdown editor API with TypeScript, Express, SQLite, and Automerge CRDTs"
- Complete Fly.io deployment guide
- WebSocket URLs and configuration
- Monitoring commands

## The Lessons of Deployment

1. **Local dev hides type errors** - TypeScript's dev mode is forgiving, build mode is not
2. **WebSocket configs are different** - HTTP deployments don't prepare you for WebSocket complexity
3. **Environment variables multiply** - API URL, WebSocket URL, different for each environment
4. **Sometimes starting fresh is faster** - Don't fight with broken VMs

## The Victory

By 8:00 AM Saturday, TnyOffice was live:
- API deployed on Fly.io with WebSocket support
- Real-time collaboration working across the internet
- Persistent SQLite storage with volume mounts
- Automatic HTTPS with WebSocket upgrade

The browser console showed the magic:
```
WebSocket connected to wss://tny-office-api.fly.dev/automerge-sync
Automerge document synchronized
```

Two users, different locations, same document, instant sync.

## The Architecture Complete

The deployment revealed the full architecture:

```
Browser (Next.js + Automerge)
    ↓ WSS
Fly.io (Express + WebSocket Server)
    ↓
SQLite (Persistent Volume)
    ↓
Automerge Storage Adapter
```

Every piece had found its place. The prototype was no longer local—it was real, deployed, accessible.

The dream from Friday evening—"GDocs for markdown"—was now a URL anyone could visit.

*To be continued...*

---

*Next: Polish, performance, and the features that turn a prototype into a product.*