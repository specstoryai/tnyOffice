# Building TnyOffice: Comments, Finally

## Part 11: The Google Docs Feature Everyone Expected

*July 20, 2025, 12:08 PM EDT*

After the git integration planning, attention turned to what every collaborative editor needs: "we're going to make a plan for commenting capabilities in this app."

I shared a detailed proposal—a canvas outlining Google Docs-style comments on top of the existing Next.js + CodeMirror 6 + Automerge setup. The architecture was clear, the approach was solid. But Claude had learned something important by now.

"remember this is a solid prototype. make simple, straightforward plans for prototyping"

## The Simplification

The plans that emerged were beautifully minimal:

### API Plan
```typescript
interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  anchorStart: number;  // character offset
  anchorEnd: number;
}
```

Three endpoints. That's it:
- `POST /api/v1/files/:id/comments` - Create
- `GET /api/v1/files/:id/comments` - List
- `DELETE /api/v1/files/:id/comments/:commentId` - Delete

### UI Plan
- Yellow highlights for commented text
- Simple sidebar listing comments
- Click comment to jump to text
- Cmd+K to add comment

No threads. No replies. No resolve/unresolve. No permissions. Just comments.

## The Critical Question

"with this approach, will the comments show up in the actual text of the document that a user sees?"

This was important. The answer revealed the elegance of the design:

"No, comments won't show up in the actual document text. The comments are stored in a separate `comments` map within the Automerge document structure, not mixed into the `content` text field."

Like Google Docs—highlighted text in the document, comment content in the sidebar. The markdown stays clean.

## The Implementation Sprint

"great. the current approach you've proposed is good. begin implementing the api"

What followed was a methodical implementation:

### 1. Update the Types
```typescript
// Added to MarkdownDocument
export interface MarkdownDocument {
  content: string;
  comments?: { [id: string]: Comment };
  metadata?: {...};
}
```

### 2. Add the Endpoints
The beauty was in what didn't need to be added:
- No WebSocket code (Automerge syncs the comments automatically)
- No persistence logic (comments live in the document)
- No conflict resolution (CRDTs handle it)

### 3. The Testing Moment
"give me the specific curl commands for this file id 4e2f1e8d-8de0-4a58-91dc-d049ceb70f0b"

```bash
curl -X POST http://localhost:3001/api/v1/files/4e2f1e8d-8de0-4a58-91dc-d049ceb70f0b/comments \
  -H "Content-Type: application/json" \
  -d '{
    "author": "TestUser",
    "text": "This needs clarification",
    "anchorStart": 10,
    "anchorEnd": 25
  }'
```

"yep. those work."

## The UI Implementation

"great. work on the ui implementation"

The UI came together in layers:

### CodeMirror Extension
```typescript
const commentMark = Decoration.mark({
  class: 'cm-comment-highlight',
  attributes: { title: 'Click to view comment' }
});
```

### Comments Sidebar
A simple React component showing:
- Author and timestamp
- Comment text
- Character range
- Delete button for your own comments

### The Integration
The magic was that comments synced automatically through Automerge. Add a comment in one browser, see it instantly in another. Edit the document, comments stay anchored to the right text.

## The Architecture Beauty

What made this implementation special wasn't what was built—it was what wasn't needed:

**Didn't need:**
- Separate comment database table
- WebSocket message types for comments
- Position recalculation logic
- Conflict resolution code
- Manual sync logic

**Got for free:**
- Real-time sync
- Automatic position tracking
- Conflict-free updates
- Persistence with document
- Offline support

## The Philosophical Victory

This commenting implementation was the culmination of every architectural decision:
- Automerge provided the sync
- CRDTs handled the conflicts
- WebSockets were already there
- The document model just expanded

Saturday afternoon. In four hours, TnyOffice had gained a feature that takes most editors weeks to implement. Not because Claude was fast, but because the foundation was right.

## The Pattern Complete

Looking at the day's progression:
- **Morning**: Git integration planning
- **Afternoon**: Comments implementation
- **Foundation**: Everything built on Automerge

Each feature wasn't a separate system—it was an extension of the document model. Comments weren't bolted on; they were always possible, just waiting to be revealed.

The prototype was becoming something more. Not through grand features, but through careful additions that each made the whole more complete.

*To be continued...*

---

*Next: Performance optimizations, presence awareness, and the features that make collaboration feel magical.*