# Building TnyOffice: The Automerge Pivot

## Part 6: When cr-sqlite Says No, Try Something Else

*July 20, 2025, 6:28 AM EDT*

Saturday morning. After the npm errors of the night before, I woke up with a different approach: "read @README.md @apps/api/README.md and @apps/docs/README.md then create a new plan in @apps/docs/plans/ called automerge_plan.md that uses https://www.npmjs.com/package/@automerge/automerge-codemirror"

The pivot from cr-sqlite to Automerge. Sometimes the best technical decision is recognizing when to change course.

## The Research Phase

Claude didn't just read the npm package description. It went deep, fetching the actual source code from GitHub:

- `plugin.ts` - The core ViewPlugin that syncs CodeMirror and Automerge
- `codeMirrorToAm.ts` - Converting CodeMirror transactions to Automerge changes
- `amToCodemirror.ts` - Converting Automerge patches to CodeMirror transactions
- `DocHandle.ts` - The interface for managing Automerge documents

This wasn't surface-level planning. Claude understood the bidirectional sync mechanism, the reconciliation flags, the patch application process. It grasped how `automergeSyncPlugin` would bridge two different document models.

## The Comprehensive Plan

What emerged wasn't just a technical specification—it was a complete transformation strategy for TnyOffice. The plan covered everything:

### Architecture Evolution
```typescript
// From this (simple SQLite storage):
const doc = db.prepare('SELECT * FROM files WHERE id = ?').get(id);

// To this (CRDT-powered collaboration):
const docHandle = getDocumentHandle(documentId);
const syncPlugin = automergeSyncPlugin({
  handle: docHandle,
  path: ['content']
});
```

### Three-Phase Implementation
1. **Backend Infrastructure**: WebSockets, Automerge documents, binary storage
2. **Frontend Integration**: CodeMirror plugin, document handles, sync protocol
3. **Synchronization Protocol**: Loading flows, real-time sync, persistence

The plan even included database migrations, WebSocket message formats, security considerations, and rollback strategies.

## The Reality Check

But what stood out most was the pragmatism:

- **Timeline**: 1.5-2 weeks for MVP (not months)
- **Success Metrics**: Sub-100ms sync latency, 10+ concurrent editors
- **Migration Strategy**: Backward compatible, gradual rollout
- **Testing Scenarios**: Offline/online transitions, conflict resolution, network interruptions

This wasn't academic. Every section addressed real problems:
- What happens when a user goes offline mid-edit?
- How do you handle server restarts with active connections?
- What about document size limits and performance?

## The Technical Depth

The plan showed deep understanding of both systems:

```typescript
// Client → Server messages
interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'sync';
  documentId: string;
  data?: Uint8Array; // Automerge sync data
}

// CodeMirror integration
extensions: [
  markdown(),
  syncPlugin,  // The magic happens here
  // ... other extensions
]
```

Each technical decision was justified. Binary format for efficiency. Lazy loading for performance. Batch messages for network optimization.

## The Vision Beyond MVP

The "Future Enhancements" section revealed the real ambition:
- **Presence Awareness**: See other users' cursors
- **Comments**: Inline discussions in documents
- **Version History**: Time travel through document states
- **Conflict Visualization**: See exactly how changes merged

This wasn't just about making documents sync. It was about building a collaborative experience that could rival Google Docs.

## The Pattern Continues

Saturday morning, 6:28 AM. Less than 13 hours after the initial brainstorm, the project had:
- Pivoted from file storage to SQLite
- Attempted cr-sqlite integration
- Hit roadblocks with package installation
- Pivoted again to Automerge
- Produced a comprehensive implementation plan

Each failure taught something. Each pivot refined the vision. The dream of "GDocs for markdown" was still alive, just taking a different path than expected.

The plan was written. The research was done. Now it was time to build.

*To be continued...*

---

*Next: The "two-week" implementation marathon begins. WebSockets, binary documents, and why making two browsers show the same text is harder than rocket science.*