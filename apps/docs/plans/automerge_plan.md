# Automerge Integration Plan for TnyOffice Docs

## Overview

This plan outlines the integration of `@automerge/automerge-codemirror` to enable real-time collaborative editing in the TnyOffice Docs application. The integration will allow multiple users to edit markdown documents simultaneously with automatic conflict resolution using Automerge's CRDT (Conflict-free Replicated Data Type) technology.

## Architecture Overview

### Current State
- **Frontend**: Next.js app with CodeMirror 6 for markdown editing
- **Backend**: Express API with SQLite storage
- **Editor**: CodeMirror 6 with markdown syntax highlighting
- **Storage**: Documents stored in SQLite with id, filename, content, timestamps

### Target State
- **Frontend**: Same stack + Automerge for real-time sync
- **Backend**: API extended with WebSocket support for real-time updates
- **Editor**: CodeMirror 6 + automerge-codemirror plugin
- **Storage**: SQLite + Automerge document history/binary format

## Implementation Plan

### Phase 1: Backend Infrastructure

#### 1.1 Add Automerge to API Service
```bash
cd apps/api
npm install @automerge/automerge @automerge/automerge-repo
npm install ws @types/ws  # WebSocket support
```

#### 1.2 Create Automerge Document Model
- Extend SQLite schema to store Automerge binary documents
- Add columns: `automerge_binary` (BLOB), `automerge_heads` (TEXT)
- Create conversion utilities between markdown and Automerge documents

#### 1.3 WebSocket Server Implementation
- Add WebSocket server alongside Express
- Create sync protocol for document updates
- Handle client connections and document subscriptions

### Phase 2: Frontend Integration

#### 2.1 Install Dependencies
```bash
cd apps/docs
npm install @automerge/automerge @automerge/automerge-codemirror
npm install @automerge/automerge-repo-network-websocket
```

#### 2.2 Create Automerge Repository
- Initialize Automerge Repo in the frontend
- Configure WebSocket network adapter
- Create document handles for each opened document

#### 2.3 Integrate automerge-codemirror Plugin
- Modify `Editor.tsx` to use `automergeSyncPlugin`
- Create `DocHandle` for each document
- Configure bidirectional sync between CodeMirror and Automerge

### Phase 3: Synchronization Protocol

#### 3.1 Document Loading Flow
1. Client requests document by ID
2. API returns document metadata + Automerge binary
3. Client initializes Automerge document from binary
4. Client creates CodeMirror instance with sync plugin
5. WebSocket connection established for real-time updates

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

## API Changes

### New Endpoints

#### WebSocket Endpoint
```
ws://localhost:3001/sync
```

#### Modified REST Endpoints

##### GET /api/v1/files/:id
Response includes:
```json
{
  "id": "uuid",
  "filename": "document.md",
  "content": "# Markdown content",
  "automerge_binary": "base64_encoded_binary",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

##### PUT /api/v1/files/:id
Accepts either:
- Traditional JSON with content field
- Automerge binary data for sync

### WebSocket Messages

#### Client → Server
```typescript
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'sync';
  documentId: string;
  data?: Uint8Array; // Automerge sync data
}
```

#### Server → Client
```typescript
interface ServerMessage {
  type: 'sync' | 'error' | 'subscribed';
  documentId: string;
  data?: Uint8Array; // Automerge sync data
  error?: string;
}
```

## Component Changes

### Editor.tsx Modifications
```typescript
import { automergeSyncPlugin } from '@automerge/automerge-codemirror';
import { DocHandle } from '@automerge/automerge-codemirror';

// In editor setup:
const docHandle = getDocumentHandle(documentId);
const syncPlugin = automergeSyncPlugin({
  handle: docHandle,
  path: ['content'] // Path to text content in Automerge doc
});

// Add to extensions:
extensions: [
  markdown(),
  syncPlugin,
  // ... other extensions
]
```

### DocumentViewer.tsx Changes
- Add connection status indicator
- Show active collaborators
- Handle offline mode gracefully

## Database Schema Updates

```sql
-- Add Automerge columns to files table
ALTER TABLE files ADD COLUMN automerge_binary BLOB;
ALTER TABLE files ADD COLUMN automerge_heads TEXT;

-- Create sync metadata table
CREATE TABLE sync_metadata (
  document_id TEXT PRIMARY KEY,
  last_sync INTEGER DEFAULT (unixepoch()),
  sync_version INTEGER DEFAULT 1,
  FOREIGN KEY (document_id) REFERENCES files(id)
);
```

## Testing Strategy

### Unit Tests
- Test Automerge document conversions
- Test WebSocket message handling
- Test sync protocol edge cases

### Integration Tests
- Test multi-client editing scenarios
- Test conflict resolution
- Test offline/online transitions
- Test large document handling

### Manual Testing Scenarios
1. Two users editing same document
2. User goes offline, makes changes, comes back online
3. Multiple rapid edits from multiple users
4. Network interruption during sync
5. Server restart with active connections

## Performance Considerations

### Optimizations
- Implement document lazy loading
- Use Automerge binary format for efficiency
- Batch WebSocket messages
- Implement presence indicators efficiently

### Monitoring
- Track sync latency
- Monitor WebSocket connection health
- Log Automerge document size growth
- Track active connections per document

## Security Considerations

### Authentication
- Extend current auth to WebSocket connections
- Validate document access permissions
- Rate limit sync messages

### Data Validation
- Validate Automerge binary data
- Sanitize all WebSocket messages
- Implement max document size limits

## Migration Strategy

### Rollout Plan
1. Deploy backend with WebSocket support (backward compatible)
2. Add Automerge columns to database
3. Implement document migration utility
4. Deploy frontend with opt-in collaboration
5. Gradually enable for all documents

### Rollback Plan
- Keep markdown content in sync with Automerge
- Allow disabling collaborative features
- Export to plain markdown functionality

## Future Enhancements

1. **Presence Awareness**: Show cursor positions and selections
2. **Comments**: Add inline comments using Automerge
3. **Version History**: Browse and restore document versions
4. **Conflict Visualization**: Show merge conflicts visually
5. **Permission System**: Read-only viewers, edit permissions
6. **Performance**: Implement Automerge compaction strategies

## Dependencies Summary

### Backend
- @automerge/automerge
- @automerge/automerge-repo
- ws (WebSocket server)

### Frontend
- @automerge/automerge
- @automerge/automerge-codemirror
- @automerge/automerge-repo-network-websocket

## Success Metrics

- Sub-100ms sync latency for typical edits
- Support for 10+ concurrent editors
- Zero data loss during conflicts
- Seamless offline/online transitions
- Backward compatibility maintained

## Timeline Estimate

- Phase 1 (Backend): 3-4 days
- Phase 2 (Frontend): 2-3 days
- Phase 3 (Testing & Polish): 2-3 days
- Total: ~1.5-2 weeks for MVP

This plan provides a comprehensive approach to integrating Automerge with the existing TnyOffice Docs application while maintaining stability and providing a clear upgrade path.