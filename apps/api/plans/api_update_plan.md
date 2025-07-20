# 🛠️ Real-Time Collaborative Markdown Editor Plan

## Overview

This plan outlines the evolution of our markdown editor from a basic CRUD API to a real-time collaborative system using Automerge for CRDT-based conflict resolution.

## Current State (✅ Completed)

We have successfully implemented and deployed a basic TypeScript Node.js API with SQLite storage:

- **Tech Stack**: Express 5.1.0, better-sqlite3 12.2.0, TypeScript
- **Database**: Regular SQLite for document metadata
- **Deployment**: Running on Fly.io with persistent volume at `/data`
- **Endpoints**: 
  - `POST /api/v1/files` - Create markdown files
  - `GET /api/v1/files` - List files with pagination
  - `GET /api/v1/files/:id` - Get file by ID
  - `PUT /api/v1/files/:id` - Update file content
- **Frontend**: Docs app successfully connects to deployed API with edit/save capabilities

## Target Architecture

```
Browser clients ↔ WebSocket ↔ Express API ↔ Automerge Repo
                              ↔ REST API    ↔ SQLite (metadata)
                                           ↔ SQLite Storage Adapter
```

---

## ✅ Core Goals for Real-Time Update

- Add real-time editing capabilities to existing API using Automerge
- Create a custom SQLite storage adapter for Automerge to persist documents
- Allow multiple clients to see each other's updates live with automatic conflict resolution
- Maintain existing REST endpoints while adding WebSocket support
- Enable Git export of documents as markdown files

---

## 🧱 Tech Stack Evolution

| Layer | Current | Target for Real-time |
|-------|---------|---------------------|
| Frontend | Next.js, React, CodeMirror 6 | + WebSocket client |
| API | Express, TypeScript | + Socket.io server |
| Database | SQLite (better-sqlite3) | + Automerge documents |
| CRDT | None | Automerge Repo |
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
│   │   │   └── sqlite-storage.ts      # SQLite storage adapter for Automerge
│   │   ├── automerge/
│   │   │   ├── repo.ts                # Automerge Repo setup
│   │   │   └── sqlite-adapter.ts      # Custom SQLite storage adapter
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

### Step 1: Add UPDATE Endpoint (REST) ✅
1. ✅ Add `PUT /api/v1/files/:id` endpoint
2. ✅ Test with existing frontend
3. ✅ Add edit/save functionality to docs app

### Step 2: Create SQLite Storage Adapter for Automerge
1. Install Automerge dependencies (`@automerge/automerge-repo`)
2. Create SQLiteStorageAdapter implementing StorageAdapterInterface
3. Add binary data storage table to SQLite schema
4. Implement load, save, remove, loadRange, removeRange methods
5. Test adapter with unit tests

### Step 3: Initialize Automerge Repo
1. Create Automerge Repo instance with SQLite storage
2. Convert existing documents to Automerge documents
3. Add WebSocketServerAdapter for real-time sync
4. Update REST endpoints to work with Automerge documents

### Step 4: Add WebSocket Support
1. Install Socket.io and Automerge WebSocket adapter
2. Configure WebSocketServerAdapter with Express
3. Implement document synchronization protocol
4. Test real-time sync between multiple clients

### Step 5: Frontend Integration
1. Add Automerge Repo client to docs app
2. Create CollaborativeEditor component using Automerge
3. Implement WebSocketClientAdapter
4. Add presence indicators and cursor tracking

### Step 6: Enhanced Features
1. Add presence/awareness support
2. Implement offline support with sync on reconnect
3. Create export endpoint for Git
4. Add document history/versions view

---

## 📡 Automerge Sync Protocol

Automerge handles synchronization automatically through its sync protocol. The WebSocket adapter manages:

### Built-in Sync Messages
- **Sync State Exchange**: Automatic exchange of document states
- **Binary Updates**: Efficient binary patches for changes
- **Peer Discovery**: Automatic peer connection management

### Custom Application Events

```typescript
// Presence/Awareness (custom layer)
{
  type: "presence",
  docId: string,
  userId: string,
  cursor?: { line: number, ch: number },
  selection?: { from: Position, to: Position }
}
```

---

## 💾 Database Schema Evolution

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

### Enhanced Schema with Automerge
```sql
-- Document metadata (existing table, enhanced)
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,  -- Keep for backward compatibility/caching
  automerge_id TEXT UNIQUE,  -- Automerge document ID
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Automerge binary storage (new)
CREATE TABLE automerge_storage (
  key TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Storage key prefix index for range queries
CREATE INDEX idx_automerge_key_prefix ON automerge_storage(key);
```

---

## 🗄️ SQLite Storage Adapter Design

The custom SQLite storage adapter will implement Automerge's `StorageAdapterInterface`:

```typescript
class SQLiteStorageAdapter implements StorageAdapterInterface {
  constructor(private db: Database) {}

  async load(key: string[]): Promise<Uint8Array | undefined> {
    // Load binary data from automerge_storage table
    const keyStr = key.join(':');
    const row = db.prepare('SELECT data FROM automerge_storage WHERE key = ?').get(keyStr);
    return row ? new Uint8Array(row.data) : undefined;
  }

  async save(key: string[], data: Uint8Array): Promise<void> {
    // Save binary data to automerge_storage table
    const keyStr = key.join(':');
    db.prepare('INSERT OR REPLACE INTO automerge_storage (key, data) VALUES (?, ?)').run(keyStr, Buffer.from(data));
  }

  async remove(key: string[]): Promise<void> {
    // Remove entry from storage
    const keyStr = key.join(':');
    db.prepare('DELETE FROM automerge_storage WHERE key = ?').run(keyStr);
  }

  async loadRange(keyPrefix: string[]): Promise<{ key: string[], data: Uint8Array }[]> {
    // Load all entries matching prefix
    const prefix = keyPrefix.join(':');
    const rows = db.prepare('SELECT key, data FROM automerge_storage WHERE key LIKE ?').all(prefix + '%');
    return rows.map(row => ({
      key: row.key.split(':'),
      data: new Uint8Array(row.data)
    }));
  }

  async removeRange(keyPrefix: string[]): Promise<void> {
    // Remove all entries matching prefix
    const prefix = keyPrefix.join(':');
    db.prepare('DELETE FROM automerge_storage WHERE key LIKE ?').run(prefix + '%');
  }
}
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
- ✅ UPDATE endpoint working
- ✅ Edit/save functionality in frontend

### Phase 2 (Automerge Integration)
- ⏳ SQLite storage adapter implemented
- ⏳ Automerge Repo initialized
- ⏳ Documents converted to Automerge format
- ⏳ WebSocket sync working

### Phase 3 (Real-time Collaboration)
- ⏳ Multiple users can edit same document
- ⏳ Changes sync automatically with conflict resolution
- ⏳ Presence indicators and cursor positions
- ⏳ Offline support with sync on reconnect

---

## 📅 Estimated Timeline

From current state:
- Step 1 (UPDATE endpoint): ✅ Completed
- Step 2 (SQLite Storage Adapter): 1 day
- Step 3 (Automerge Repo setup): 1 day
- Step 4 (WebSocket integration): 1 day
- Step 5 (Frontend integration): 1.5 days
- Step 6 (Enhanced features): 1 day

**Total: ~5.5 days for complete real-time collaboration**

---

## 🚧 Next Immediate Steps

1. ✅ **UPDATE endpoint completed** with frontend integration
2. **Install Automerge dependencies** (`@automerge/automerge-repo`)
3. **Create SQLite storage adapter** implementing StorageAdapterInterface
4. **Initialize Automerge Repo** with SQLite backend
5. **Test document conversion** from plain text to Automerge documents