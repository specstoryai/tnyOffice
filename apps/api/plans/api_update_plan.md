# 🛠️ Real-Time Collaborative Markdown Editor Plan

## Overview

This plan outlines the evolution of our markdown editor from a basic CRUD API to a real-time collaborative system using cr-sqlite for CRDT-based conflict resolution.

## Current State (✅ Completed)

We have successfully implemented and deployed a basic TypeScript Node.js API with SQLite storage:

- **Tech Stack**: Express 5.1.0, better-sqlite3 12.2.0, TypeScript
- **Database**: Regular SQLite (not cr-sqlite yet)
- **Deployment**: Running on Fly.io with persistent volume at `/data`
- **Endpoints**: 
  - `POST /api/v1/files` - Create markdown files
  - `GET /api/v1/files` - List files with pagination
  - `GET /api/v1/files/:id` - Get file by ID
- **Frontend**: Docs app successfully connects to deployed API

## Target Architecture

```
Browser clients ↔ WebSocket ↔ Express API ↔ cr-sqlite backend
                              ↔ REST API (existing)
```

---

## ✅ Core Goals for Real-Time Update

- Add real-time editing capabilities to existing API
- Migrate from regular SQLite to cr-sqlite for automatic conflict resolution
- Allow multiple clients to see each other's updates live
- Maintain existing REST endpoints while adding WebSocket support
- Enable Git export of documents as markdown files

---

## 🧱 Tech Stack Evolution

| Layer | Current | Target for Real-time |
|-------|---------|---------------------|
| Frontend | Next.js, React, CodeMirror 6 | + WebSocket client |
| API | Express, TypeScript | + Socket.io server |
| Database | SQLite (better-sqlite3) | cr-sqlite (CRDT-enabled) |
| Transport | HTTP/REST | + WebSocket via Socket.io |
| Deployment | Fly.io with volume | Same, with WebSocket support |

---

## 🗂️ Enhanced Project Structure

```
apps/
├── api/
│   ├── src/
│   │   ├── routes/
│   │   │   └── files.ts               # Existing REST endpoints
│   │   ├── db/
│   │   │   ├── database.ts            # Current SQLite setup
│   │   │   └── cr-database.ts         # New cr-sqlite setup
│   │   ├── websocket/
│   │   │   ├── server.ts              # Socket.io server setup
│   │   │   └── handlers.ts            # WebSocket event handlers
│   │   ├── utils/
│   │   │   ├── logger.ts              # Current logger
│   │   │   └── git-export.ts          # Export to Git
│   │   └── index.ts                   # Main server file
│   ├── server.ts                      # Enhanced server with WebSocket
│   └── database.db                    # SQLite database (will migrate)
└── docs/
    └── components/
        ├── Editor.tsx                  # Current editor
        └── CollaborativeEditor.tsx     # New real-time editor
```

---

## 🔄 Implementation Steps

### Step 1: Add UPDATE Endpoint (REST)
1. Add `PUT /api/v1/files/:id` endpoint
2. Update database schema to track versions
3. Test with existing frontend

### Step 2: Migrate to cr-sqlite
1. Install cr-sqlite dependencies
2. Create migration script from SQLite to cr-sqlite
3. Update database.ts to use cr-sqlite
4. Test existing endpoints still work

### Step 3: Add WebSocket Support
1. Install Socket.io
2. Update server to support WebSocket connections
3. Implement document room management
4. Create WebSocket event handlers

### Step 4: Real-time Sync
1. Implement document change broadcasting
2. Add cursor position tracking
3. Handle conflict resolution with cr-sqlite
4. Test with multiple clients

### Step 5: Frontend Integration
1. Add Socket.io client to docs app
2. Create CollaborativeEditor component
3. Implement real-time update handlers
4. Add presence indicators

### Step 6: Git Export
1. Create export endpoint
2. Implement markdown file generation
3. Add git commit functionality
4. Document export process

---

## 📡 WebSocket Events

### Client → Server

```typescript
// Join document editing session
{
  type: "join-document",
  docId: string,
  userId?: string  // Optional for prototype
}

// Send document update
{
  type: "update-document",
  docId: string,
  content: string,  // Full content for now, can optimize later
  cursorPosition?: { line: number, ch: number }
}

// Leave document
{
  type: "leave-document",
  docId: string
}
```

### Server → Client

```typescript
// Document sync update
{
  type: "document-sync",
  docId: string,
  content: string,
  version?: number
}

// Presence update (optional for MVP)
{
  type: "presence-update",
  docId: string,
  users: Array<{
    id: string,
    cursorPosition?: { line: number, ch: number }
  }>
}
```

---

## 💾 Database Migration Plan

### Current Schema (SQLite)
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
```

### Target Schema (cr-sqlite)
```sql
-- Main documents table with CRDT support
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
) USING crsql;

-- Optional: Track active sessions
CREATE TABLE sessions (
  user_id TEXT,
  doc_id TEXT,
  last_seen INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, doc_id)
);
```

---

## 🔐 Security Considerations

1. **WebSocket Authentication** (Future)
   - For now: Open access (prototype)
   - Later: Token-based auth

2. **Validation**
   - Zod schemas for all WebSocket messages
   - Document size limits (5MB)
   - Rate limiting on updates

---

## 🚀 Deployment Updates

1. **Fly.io Configuration**
   - Update fly.toml to support WebSocket
   - Ensure sticky sessions for Socket.io
   - Test WebSocket connectivity

2. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://docs-app-url.com
   ```

---

## 📊 Performance Considerations

1. **Optimization Strategy**
   - Start with full document sync
   - Add incremental updates later
   - Implement debouncing (200ms)

2. **Scaling Path**
   - Single instance for prototype
   - Redis adapter for multi-instance later
   - Connection limits per document

---

## 🧪 Testing Plan

1. **Manual Testing**
   - Multiple browser windows
   - Network failure scenarios
   - Large document handling

2. **Automated Tests** (Future)
   - WebSocket connection tests
   - Conflict resolution tests
   - API regression tests

---

## 🎯 Success Criteria

### Phase 1 (REST Update)
- ✅ Basic CRUD API deployed
- ⏳ UPDATE endpoint working
- ⏳ Version tracking in place

### Phase 2 (Real-time MVP)
- ⏳ Multiple users can edit same document
- ⏳ Changes appear within 500ms
- ⏳ No data loss on conflicts
- ⏳ Works with 2-5 concurrent users

### Phase 3 (Production Ready)
- ⏳ Handles 20+ concurrent users per document
- ⏳ Presence indicators
- ⏳ Cursor position sharing
- ⏳ Git export functionality

---

## 📅 Estimated Timeline

From current state:
- Step 1 (UPDATE endpoint): 0.5 day
- Step 2 (cr-sqlite migration): 1 day
- Step 3-4 (WebSocket + sync): 2 days
- Step 5 (Frontend): 1 day
- Step 6 (Git export): 0.5 day

**Total: ~5 days for complete real-time collaboration**

---

## 🚧 Next Immediate Steps

1. **Add UPDATE endpoint** to complete REST CRUD
2. **Research cr-sqlite** installation for Node.js
3. **Plan WebSocket integration** with existing Express app
4. **Create test documents** for multi-user testing