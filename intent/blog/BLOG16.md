# Building TnyOffice: The Delete Feature

## Part 16: Adding Destructive Power

*July 20, 2025, 9:59 PM EDT*

Late Saturday night, a straightforward request: "learn about how this @apps/api/ is implemented and then add an api endpoint for deleting a document"

Claude's response was systematic. First understand, then implement.

## The Investigation Phase

The AI agent created a task list:
- Explore the API structure and routing setup
- Understand the document service implementation
- Review existing document operations
- Implement delete document endpoint
- Test the delete endpoint

This wasn't just coding—it was archaeology. Understanding the existing patterns before adding new functionality.

## The Architecture Discovery

Claude uncovered the layers:

### 1. Express Router Structure
```typescript
// apps/api/src/routes/files.ts
router.post('/', createFile);
router.get('/', listFiles);
router.get('/:id', getFile);
router.put('/:id', updateFile);
// DELETE was missing
```

### 2. Database Schema
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  automerge_id TEXT UNIQUE,
  created_at INTEGER,
  updated_at INTEGER
)
```

### 3. Automerge Integration
Files weren't just database rows—they had associated Automerge documents for real-time collaboration.

## The Implementation

Claude's delete endpoint was comprehensive:

```typescript
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validate UUID format
  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid file ID format' });
  }
  
  // Check if file exists
  const file = db.prepare('SELECT id, automerge_id FROM files WHERE id = ?').get(id);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Clean up Automerge document if it exists
  if (file.automerge_id) {
    try {
      const repo = getRepo();
      await repo.delete(file.automerge_id);
      log.info(`Deleted Automerge document ${file.automerge_id}`);
    } catch (error) {
      log.error(`Error deleting Automerge document:`, error);
      // Continue with file deletion even if Automerge cleanup fails
    }
  }
  
  // Delete from database
  const result = db.prepare('DELETE FROM files WHERE id = ?').run(id);
  
  return res.json({ 
    success: true, 
    message: `File ${id} deleted successfully` 
  });
});
```

## The Crucial Details

### Error Resilience
The implementation gracefully handled Automerge deletion failures—logging the error but continuing with database cleanup. Production thinking.

### Import Management
```typescript
import { AutomergeUrl } from '@automerge/automerge-repo';
import { getRepo } from '../automerge/repo.js';
```

Claude automatically added the necessary imports, understanding the module structure.

### TypeScript Compliance
Initial attempt had an unused variable. The TypeScript error:
```
src/routes/files.ts(529,15): error TS6133: 'handle' is declared but its value is never read.
```

Fixed immediately. No sloppy code.

## The Testing Interface

"just add it to @apps/api/src/public/index.html so I can test it manually"

Claude enhanced the test interface:

### HTML Addition
```html
<div class="endpoint-card">
  <div class="endpoint-header">
    <span class="method delete">DELETE</span>
    <span class="path">/api/v1/files/:id</span>
  </div>
  <div class="endpoint-body">
    <p>Delete a file by ID</p>
    <form id="deleteForm">
      <input type="text" id="deleteFileId" placeholder="UUID" required>
      <button type="submit" class="btn btn-danger">Delete File</button>
    </form>
  </div>
</div>
```

### JavaScript Handler
```javascript
deleteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileId = formData.get('deleteFileId');
  
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete file ${fileId}?`)) {
    return;
  }
  
  const result = await makeRequest('DELETE', `${API_BASE}/${fileId}`);
  
  if (result && result.status === 200) {
    deleteForm.reset();
  }
});
```

Confirmation dialog included. No accidental deletions.

### CSS Styling
```css
.method.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
```

Visual language of danger. Red means destructive.

## The API Key Addition

"put an input box at the top where I can paste an API_KEY"

The session ended with adding authentication testing capability:

```html
<section class="api-key-section">
  <div class="api-key-card">
    <h3>API Authentication</h3>
    <input type="text" id="apiKey" placeholder="Enter your API key" />
    <button id="saveApiKey" class="btn btn-primary">Save</button>
    <button id="clearApiKey" class="btn btn-secondary">Clear</button>
    <p class="api-key-status" id="apiKeyStatus">No API key set</p>
  </div>
</section>
```

Testing infrastructure evolving alongside the API.

## The Pattern

This session exemplified the development rhythm:

1. **Understand before implementing** - Read existing code first
2. **Follow established patterns** - Match the existing router structure
3. **Handle edge cases** - Automerge cleanup, validation, error handling
4. **Make it testable** - Interactive UI for manual testing
5. **Think about security** - API key input for auth testing

## The Meta-Level

Saturday night, 9:59 PM. After a full day of building, still adding features. But notice the progression:

- Morning: Basic CRUD operations
- Afternoon: Real-time collaboration
- Evening: Security implementation
- Night: Destructive operations and testing infrastructure

Each session building on the last, each feature more sophisticated than the previous.

## The Lesson

Delete is simple in concept, complex in implementation. It's not just removing a row from a database—it's cleaning up distributed state, handling partial failures, confirming user intent, and maintaining system integrity.

The late-night coding session revealed the difference between a prototype and production code: It's in the error handling, the confirmations, the graceful degradation, and the testing tools.

Building software is as much about destroying data safely as creating it.

*To be continued...*

---

