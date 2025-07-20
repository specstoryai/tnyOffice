# Automerge Integration Plan for TnyOffice Docs

## Overview

This plan outlines the integration of `@automerge/automerge-codemirror` to enable real-time collaborative editing in the TnyOffice Docs application. The integration will allow multiple users to edit markdown documents simultaneously with automatic conflict resolution using Automerge's CRDT (Conflict-free Replicated Data Type) technology.

## Current Implementation Status ✅

### Backend (Completed)
- ✅ SQLite storage adapter for Automerge binary data
- ✅ Automerge Repo initialized with storage
- ✅ WebSocket server running on `/automerge-sync`
- ✅ REST endpoints updated to use Automerge documents
- ✅ New endpoint: `GET /api/v1/files/:id/automerge` returns document URL
- ✅ Socket.io server for presence/awareness on `/socket.io/`

## Architecture Overview

### Current State
- **Frontend**: Next.js app with CodeMirror 6 for markdown editing
- **Backend**: Express API with SQLite storage
- **Editor**: CodeMirror 6 with markdown syntax highlighting
- **Storage**: Documents stored in SQLite with id, filename, content, timestamps

### Target State  
- **Frontend**: Same stack + Automerge for real-time sync
- **Backend**: ✅ API extended with WebSocket support for real-time updates
- **Editor**: CodeMirror 6 + automerge-codemirror plugin
- **Storage**: ✅ SQLite + Automerge document binary format in `automerge_storage` table

## Implementation Plan

### Phase 1: Backend Infrastructure ✅ COMPLETED

#### 1.1 Add Automerge to API Service ✅
- Installed `@automerge/automerge` and `@automerge/automerge-repo`
- Installed `ws` for WebSocket support
- Installed `@automerge/automerge-repo-network-websocket`

#### 1.2 Create Automerge Document Model ✅
- Created `automerge_storage` table for binary storage
- Added `automerge_id` column to `files` table
- Created `DocumentService` for markdown ↔ Automerge conversion
- Implemented `SQLiteStorageAdapter` for Automerge Repo

#### 1.3 WebSocket Server Implementation ✅
- WebSocket server running on `/automerge-sync` 
- Using `WebSocketServerAdapter` for Automerge sync
- Socket.io on `/socket.io/` for presence/awareness

### Phase 2: Frontend Integration 🚧 IN PROGRESS

#### 2.1 Install Dependencies
```bash
cd apps/docs
npm install @automerge/automerge @automerge/automerge-repo
npm install @automerge/automerge-codemirror
npm install @automerge/automerge-repo-network-websocket
```

#### 2.2 Create Automerge Repository
- Initialize Automerge Repo in the frontend
- Configure `WebSocketClientAdapter` to connect to `ws://localhost:3001/automerge-sync`
- Create document handles using the Automerge URL from API

#### 2.3 Integrate automerge-codemirror Plugin  
- Create `CollaborativeEditor.tsx` component
- Use `automergeSyncPlugin` from `@automerge/automerge-codemirror`
- Pass `DocHandle` from Automerge Repo
- Configure path to document content field

### Phase 3: Synchronization Protocol

#### 3.1 Document Loading Flow
1. Client requests document by ID via REST
2. Client calls `/api/v1/files/:id/automerge` to get Automerge URL
3. Client uses `repo.find(automergeUrl)` to get document handle
4. Document syncs automatically via WebSocket
5. CodeMirror instance created with sync plugin

#### 3.2 Real-time Sync Flow
1. User makes edit in CodeMirror
2. `automergeSyncPlugin` converts CM transaction to Automerge change
3. Change synced to server via WebSocket
4. Server broadcasts change to other connected clients
5. Remote changes applied to local Automerge doc
6. Plugin updates CodeMirror with remote changes

#### 3.3 Persistence Flow
1. Server periodically saves Automerge binary to SQLite
2. On disconnect, client's final state is persisted
3. Conflict resolution handled automatically by Automerge

## API Changes ✅ IMPLEMENTED

### New Endpoints

#### WebSocket Endpoints
```
ws://localhost:3001/automerge-sync  # Automerge document sync
ws://localhost:3001/socket.io/      # Presence/awareness
```

#### New REST Endpoint
```
GET /api/v1/files/:id/automerge
```
Returns:
```json
{
  "automergeUrl": "automerge:abc123..."
}
```

#### Modified REST Endpoints ✅

##### GET /api/v1/files/:id
- Returns content from Automerge document if available
- Falls back to SQLite content if no Automerge doc
- Response structure unchanged for backward compatibility

##### PUT /api/v1/files/:id  
- Creates Automerge document on first update
- Updates both Automerge document and SQLite
- Accepts traditional JSON with content field

### WebSocket Protocol

#### Automerge Sync (Handled Automatically)
The `@automerge/automerge-repo-network-websocket` adapter handles the sync protocol automatically. No manual message handling needed.

#### Presence/Awareness (Socket.io)
```typescript
// Client → Server
socket.emit('join-doc', docId);
socket.emit('presence', {
  docId: string,
  userId: string,
  cursor?: { line: number, ch: number },
  selection?: { from: Position, to: Position }
});
socket.emit('leave-doc', docId);

// Server → Client  
socket.on('presence', (data) => { /* handle presence update */ });
```

## Component Changes

### New CollaborativeEditor.tsx Component
```typescript
import { automergeSyncPlugin } from '@automerge/automerge-codemirror';
import { useDocument } from '@automerge/automerge-repo-react-hooks';
import type { MarkdownDocument } from '@/lib/automerge/types';

interface CollaborativeEditorProps {
  documentUrl: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function CollaborativeEditor({ documentUrl }: CollaborativeEditorProps) {
  const [doc, changeDoc] = useDocument<MarkdownDocument>(documentUrl);
  
  const extensions = [
    markdown(),
    automergeSyncPlugin({
      doc,
      path: ['content'],
      onChange: (updatedDoc) => changeDoc(updatedDoc)
    }),
    // ... other extensions
  ];
  
  return <CodeMirror extensions={extensions} />;
}
```

### DocumentViewer.tsx Changes
- Replace Editor with CollaborativeEditor when Automerge URL available
- Add connection status indicator
- Show active collaborators via Socket.io presence
- Handle offline mode with local-first editing

### New Automerge Context/Provider
```typescript
// lib/automerge/provider.tsx
import { Repo } from '@automerge/automerge-repo';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { RepoContext } from '@automerge/automerge-repo-react-hooks';

export function AutomergeProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => {
    const repo = new Repo({
      network: [
        new WebSocketClientAdapter('ws://localhost:3001/automerge-sync')
      ]
    });
    return repo;
  }, []);
  
  return (
    <RepoContext.Provider value={repo}>
      {children}
    </RepoContext.Provider>
  );
}
```

## Database Schema Updates ✅ IMPLEMENTED

```sql
-- Added to files table
ALTER TABLE files ADD COLUMN automerge_id TEXT UNIQUE;

-- Created automerge_storage table
CREATE TABLE automerge_storage (
  key TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Added index for efficient range queries
CREATE INDEX idx_automerge_key_prefix ON automerge_storage(key);
```

## Testing Strategy


### Manual Testing Scenarios
1. Two users editing same document
2. User goes offline, makes changes, comes back online
3. Multiple rapid edits from multiple users
4. Network interruption during sync
5. Server restart with active connections



## Immediate Next Steps

1. **Install Frontend Dependencies**
   ```bash
   cd apps/docs
   npm install @automerge/automerge @automerge/automerge-repo
   npm install @automerge/automerge-codemirror  
   npm install @automerge/automerge-repo-network-websocket
   npm install @automerge/automerge-repo-react-hooks
   ```

2. **Create Automerge Types**
   - Define `MarkdownDocument` interface matching backend

3. **Implement AutomergeProvider**
   - Wrap app with Repo context
   - Configure WebSocket connection

4. **Create CollaborativeEditor Component**
   - Use `automergeSyncPlugin` from `@automerge/automerge-codemirror`
   - Handle document loading via `useDocument` hook

5. **Update DocumentViewer**
   - Fetch Automerge URL from new endpoint
   - Switch between regular Editor and CollaborativeEditor

6. **Add Connection Status UI**
   - Show sync status
   - Handle offline gracefully

This plan provides a comprehensive approach to integrating Automerge with the existing TnyOffice Docs application while maintaining stability and providing a clear upgrade path.