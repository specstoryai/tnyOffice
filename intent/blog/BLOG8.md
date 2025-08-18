# Building TnyOffice: The Implementation Marathon

## Part 8: From Plan to Working Prototype

*July 20, 2025, 7:02 AM EDT*

The session started with context from a previous conversation that had run out of tokens. The summary revealed the journey: cr-sqlite attempt, npm errors, pivot to Automerge, comprehensive planning. Now it was time to build.

## The Automerge Implementation

Claude dove straight into implementation:
- SQLite storage adapter for Automerge persistence
- Document service for converting between formats
- WebSocket server with dual setup (native WS for Automerge, Socket.io for presence)
- Updated REST endpoints to use Automerge documents

The architecture was taking shape:
```
Browser ↔ WebSocket ↔ Express API ↔ Automerge Repo ↔ SQLite Storage
```

## The Frontend Battle

Then came the frontend integration. This is where things got interesting.

"TypeError: Cannot read properties of undefined (reading 'isReady')"

The first error. Claude tried using `useDocument` from automerge-repo-react-hooks. Wrong approach.

"handle.doc is not a function"

Second error. The API confusion was real. Was it `handle.doc()` or `handle.docSync()`? Was there an `isReady()` method or a `whenReady()` promise?

"TypeError: docHandle.whenReady is not a function"

"TypeError: docHandle.isReady is not a function"

I watched Claude go in circles, trying different combinations of methods that didn't exist. The frustration was palpable through the error messages.

## The Breakthrough

Finally, I had to intervene with the actual example from automerge-codemirror. The solution was simpler than all the attempts:

```typescript
const syncPlugin = automergeSyncPlugin({
  handle,
  path: ['content'],
});
```

Just pass the handle. No checking if it's ready. No waiting for promises. The plugin handles everything.

"great! that works."

## The Simplification

With collaboration working, I made a decisive call: "we don't need the read-only or Edit modes anymore. We should just always be in Collaborate mode when we click on a document."

Why have three modes when one does everything? Every document became collaborative by default. The Edit button disappeared. The Save button vanished. Just real-time sync, all the time.

## The Git Cleanup

A small but important detail: SQLite's WAL files were polluting the repository.

"i added database.db-shm and database.db-wal to the api .gitignore. But they were already committed."

Claude cleaned up the git history, removing the files from tracking while preserving the database itself.

## The Deployment Struggle

Then came the deployment attempt to Fly.io. What worked perfectly locally fell apart in Docker:

```
=> ERROR [build 5/6] RUN npm run build
```

TypeScript compilation errors. Missing type definitions. The same `await` issues we'd just fixed locally were back in the Docker build.

"isn't that await the thing we just spent forever fixing?"

I was right to be suspicious. Claude was trying to "fix" code that already worked, adding back the problematic awaits we'd removed.

"i've discarded your changes. this is working locally perfectly. let's not mess it up."

## The Wisdom of Stopping

Sometimes the best decision is to not deploy. The code worked locally. The WebSockets were syncing. Documents were collaborating. The deployment issues were configuration problems, not code problems.

"forget the deployment for now. just remember all the great work we did on the API and docs to make it real-time and collaborative."

## The State of Success

By the end of this marathon session, TnyOffice had transformed:

**Before:**
- Static documents
- Manual save buttons
- Single-user editing
- File-based storage

**After:**
- Real-time collaboration
- Automatic syncing
- Multi-user editing
- CRDT-powered conflict resolution
- WebSocket communication
- Automerge documents in SQLite

The dream from Friday evening was now reality. Two browsers could edit the same document, see each other's changes instantly, and never lose data to conflicts.

## The Lessons Learned

1. **API documentation matters** - The confusion around DocHandle methods cost hours
2. **Local success ≠ deployment success** - Docker builds have their own challenges
3. **Sometimes simpler is better** - Removing edit/save modes improved the UX
4. **Know when to stop** - Not every session needs to end with deployment

Saturday morning's implementation marathon had delivered. The prototype worked. The collaboration was real. The GDocs-for-markdown dream was no longer a dream.

*To be continued...*

---

*Next: Documentation updates, architectural refinements, and the long road to production deployment.*