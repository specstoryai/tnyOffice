# Comments API Plan - Simple Prototype

## Overview
Add basic commenting functionality to the existing Automerge-based collaborative editor API.

## Data Model
Store comments directly in the Automerge document alongside the text content:

```typescript
interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  anchorStart: number;  // character offset in document
  anchorEnd: number;
}

interface DocumentWithComments {
  content: Automerge.Text;
  comments: { [id: string]: Comment };
}
```

## Implementation Steps

### 1. Update Automerge Document Schema
- Modify the document initialization to include a `comments` map
- Update the type definitions in `src/services/automerge.ts`

### 2. Add Comment REST Endpoints
```
POST /api/v1/files/:id/comments
- Create a new comment on a document
- Body: { author, text, anchorStart, anchorEnd }

GET /api/v1/files/:id/comments
- Get all comments for a document

DELETE /api/v1/files/:id/comments/:commentId
- Delete a specific comment
```

### 3. WebSocket Updates
- Comments will automatically sync via existing Automerge sync
- No additional WebSocket code needed - Automerge handles it

### 4. Simple Implementation
- Add comment routes in `src/routes/files.ts`
- Update Automerge document operations to handle comments
- Comments persist automatically with the document

## Testing
```bash
# Create a comment
curl -X POST http://localhost:3001/api/v1/files/{id}/comments \
  -H "Content-Type: application/json" \
  -d '{
    "author": "User1",
    "text": "This needs clarification",
    "anchorStart": 10,
    "anchorEnd": 25
  }'
```

## Notes
- Start simple: just text comments, no replies or threads
- Automerge will handle position updates as text changes
- Focus on getting basic create/read/delete working first