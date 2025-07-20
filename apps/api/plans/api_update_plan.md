# 🛠️ Real-Time Collaborative Markdown Editor Prototype

## Overview

This plan outlines a prototype for real-time collaborative editing of markdown documents using cr-sqlite for CRDT-based conflict resolution. Since this is a prototype, we'll focus on core functionality without maintaining backward compatibility.

## Architecture

```
Browser clients ↔ WebSocket ↔ Next.js API ↔ cr-sqlite backend
```

---

## ✅ Core Goals for Prototype

- Support real-time editing of markdown documents by multiple users
- Store all documents in cr-sqlite for automatic conflict resolution
- Allow multiple clients to see each other's updates live
- Persist all changes in the SQLite database
- Enable manual Git export of documents as markdown files
- Focus on simplicity and core functionality

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|---------|
| Frontend | Next.js, React, CodeMirror 6 with WebSocket client |
| API | Next.js with Socket.io server |
| Database | cr-sqlite (SQLite with CRDT extension) |
| Transport | WebSocket via Socket.io |
| Versioning | Git (manual export) + cr-sqlite history |

---

## 🗂️ Simplified Project Structure

```
apps/
├── api/
│   ├── app/
│   │   ├── api/
│   │   │   └── documents/             # Simple document endpoints
│   │   │       └── route.ts           # List and create documents
│   │   └── page.tsx                   # Keep API documentation
│   ├── lib/
│   │   ├── db/
│   │   │   ├── sqlite.ts              # cr-sqlite connection
│   │   │   └── schema.sql             # Database schema
│   │   ├── websocket/
│   │   │   ├── server.ts              # Socket.io server setup
│   │   │   └── handlers.ts            # WebSocket event handlers
│   │   └── git-export.ts              # Export to Git
│   ├── server.ts                      # Custom server for WebSocket
│   └── data/
│       └── tnyoffice.db               # cr-sqlite database
└── docs/
    └── components/
        └── CollaborativeEditor.tsx     # Real-time editor with WebSocket
```

---

## 🔄 Simplified Implementation Steps

### Step 1: Database Setup
1. Install cr-sqlite and dependencies
2. Create simple database schema
3. Initialize database connection

### Step 2: WebSocket Server
1. Create custom Next.js server for Socket.io
2. Implement basic document room joining
3. Handle document updates via WebSocket

### Step 3: Frontend Integration
1. Create CollaborativeEditor component
2. Connect to WebSocket server
3. Handle real-time updates in CodeMirror

### Step 4: Basic Git Export
1. Add simple export endpoint
2. Write documents to markdown files
3. Manual git commit process

---

## 📡 Simple WebSocket Events

### Client → Server

```typescript
// Join document
{
  type: "join",
  docId: string
}

// Update document
{
  type: "update",
  docId: string,
  content: string  // Full document content for simplicity
}
```

### Server → Client

```typescript
// Document update broadcast
{
  type: "sync",
  docId: string,
  content: string  // Full document content
}
```

---

## 💾 Simple Database Schema

```sql
-- Main documents table with CRDT support
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
) USING crsql;

-- That's it! cr-sqlite handles all the CRDT magic
```

---

## 🔐 Basic Security (Prototype)

1. **Simple Validation**
   - Validate WebSocket messages with Zod
   - Basic document size limits
   - No authentication for prototype (add later)

---

## 🚀 Prototype Approach

1. **Fresh Start**
   - All documents stored in cr-sqlite from the beginning
   - No migration needed - this is a clean prototype
   - Focus on getting core functionality working

2. **Simple API**
   - Minimal REST endpoints for document listing
   - WebSocket handles all real-time operations
   - No complex versioning or compatibility layers

---

## 📊 Performance Notes

1. **Keep it Simple**
   - SQLite WAL mode enabled by default
   - Basic debouncing on client (200ms)
   - No optimization until needed

---

## 🧪 Testing Approach

1. **Manual Testing**
   - Open multiple browser windows
   - Test concurrent editing
   - Verify changes persist in database
   - Test git export functionality

---

## 📝 Example Implementation

### Simple WebSocket Server (server.ts)

```typescript
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { Database } from './lib/db/sqlite';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: 'http://localhost:3002',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', async ({ docId }) => {
      socket.join(`doc:${docId}`);
      
      // Send current document
      const doc = await Database.getDocument(docId);
      if (doc) {
        socket.emit('sync', { docId, content: doc.content });
      }
    });

    socket.on('update', async ({ docId, content }) => {
      // Save to database
      await Database.updateDocument(docId, content);
      
      // Broadcast to others
      socket.to(`doc:${docId}`).emit('sync', { docId, content });
    });
  });

  server.listen(3001, () => {
    console.log('> Ready on http://localhost:3001');
  });
});
```

---

## 🎯 Prototype Success Criteria

1. **It Works!**
   - Multiple users can edit the same document
   - Changes appear in real-time
   - Data persists in SQLite database
   - Can export to Git

2. **Good Enough Performance**
   - Updates feel responsive
   - No major lag or conflicts
   - Handles 2-5 concurrent users

---

## 📅 Prototype Timeline

- Step 1: 1 day (Database setup)
- Step 2: 1 day (WebSocket server)
- Step 3: 1 day (Frontend integration)
- Step 4: 0.5 day (Git export)

**Total: ~3.5 days for working prototype**