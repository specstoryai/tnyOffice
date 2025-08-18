# Building TnyOffice: The Late Night Deploy

## Part 5: From Local to Live

*July 19, 2025, 11:37 PM EDT*

Three hours after starting the api2 project, I returned with a summary of our progress and a clear directive: "Let's do step 1 of this plan."

The plan had evolved. The Express API was now deployed on Fly.io. The SQLite database was working. We'd overcome deployment challenges—missing package-lock.json files (monorepo issues), logger package dependencies that wouldn't resolve in Docker, TypeScript compilation errors that only showed up in production builds.

But the real work was just beginning.

## The UPDATE Endpoint

Step 1 seemed simple: Add a PUT endpoint for updating files. Claude implemented it methodically:

```typescript
router.put('/:id', async (req: Request<{ id: string }, object, UpdateFileRequest>, res: Response<FileWithContent | ErrorResponse>) => {
  // Validate UUID, check existence, build dynamic update query
  // Update filename and/or content with updated_at timestamp
});
```

The implementation was clean—dynamic SQL query building that only updated the fields provided, automatic timestamp updates, proper validation with Zod. But I wanted more: "Can you include this new endpoint in testing page?"

## The Frontend Evolution

"This is great. Now let's do a basic change to @apps/docs/ app to take advantage of this, with editing ability and a save button."

What followed was a transformation of the DocumentViewer component. The read-only markdown viewer became a full editor:

- An Edit button that switched to edit mode
- Cancel to discard changes
- Save to persist them using the new PUT endpoint
- Proper state management for `isEditing`, `editedContent`, and `isSaving`

```typescript
const handleSave = async () => {
  const response = await fetch(`${API_BASE}/api/v1/files/${documentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: editedContent }),
  });
  
  const updatedData = await response.json();
  setDocument(updatedData);
  setIsEditing(false);
};
```

The docs app now had full CRUD capabilities. Users could create, read, update, and list documents. The foundation was complete.

## The cr-sqlite Pivot

"Let's move on to step 2. We don't actually need a migration script. If you run and find a database that's not using cr-sqlite just delete and recreate an empty one."

This was the moment where the real-time dream started to become concrete. cr-sqlite—Convergent, Replicated SQLite with CRDT support. Claude started researching, finding the `@vlcn.io/crsqlite` package, understanding how to load it as an extension with better-sqlite3.

```javascript
import Database from "better-sqlite3";
import { extensionPath } from "@vlcn.io/crsqlite";

const db = new Database(dbPath);
db.loadExtension(extensionPath);
```

But then, an error:

```
npm error command sh -c node ./nodejs-install-helper.js
npm error import pkg from "./package.json" assert { type: "json" };
```

## The Pattern of Progress

It was approaching midnight. We'd come so far from that Friday evening brainstorm:

1. **6:00 PM**: "GDocs for markdown" dream
2. **6:41 PM**: Monorepo foundation
3. **8:40 PM**: Logger and infrastructure
4. **8:45 PM**: Real-time ambitions and api2
5. **11:37 PM**: Deployed, updating, reaching for CRDTs

Each session built on the last, but also revealed new complexity. The cr-sqlite integration wasn't going to be straightforward. The package had installation issues. The extension loading had its own challenges.

## The State of Things

As Saturday approached, we had:
- A deployed API on Fly.io with full CRUD operations
- A frontend that could create, read, update, and list documents
- Edit/save functionality working smoothly
- The beginning of cr-sqlite integration

But not yet:
- Real-time synchronization
- Multiple users seeing each other's edits
- CRDT-based conflict resolution
- The collaborative experience we'd envisioned

The session ended with an npm error, a reminder that even the best-laid plans encounter reality. But the foundation was solid. The API was live. The editing worked. 

Tomorrow would bring new approaches to the cr-sqlite challenge. For now, it was time to sleep on it.

*To be continued...*

---

*Next: Saturday's breakthrough—"Let's try Automerge instead." The two-week journey that would finally bring real-time collaboration to life.*