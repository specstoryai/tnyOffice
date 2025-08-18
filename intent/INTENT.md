# TnyOffice Intent Document

## Core Intent: What This Software Wants to Be

TnyOffice is a **real-time collaborative markdown editor** that prioritizes seamless, conflict-free collaboration over feature complexity. It embodies the belief that documents should be living, shared spaces where multiple people can work together without the friction of traditional version control or file locking.

## Why This Exists

### The Problem
Traditional document collaboration requires either:
- Turn-taking (email attachments, file locking)
- Complex merge resolution (git conflicts)
- Proprietary platforms (Google Docs, Office 365)
- Loss of version history or collaborative context

### The Vision
Create an open-source foundation where:
- Multiple users edit simultaneously without conflicts
- Changes persist automatically without explicit saving
- Document history lives in both real-time collaboration and git
- The complexity of distributed systems is hidden from users
- Comments and conversations are first-class citizens anchored to content

## Design Philosophy

### 1. Collaboration Without Conflict
**Intent**: Remove the fear of overwriting others' work
- Uses Automerge CRDTs for automatic, mathematically-correct merge resolution
- No save buttons - all changes persist instantly
- No edit/view modes - documents are always live
- Connection status is visible but non-intrusive

### 2. Git as Memory, Not Master
**Intent**: Bridge the gap between real-time collaboration and version control
- Git becomes an export/archive, not the source of truth
- Documents can be pulled from git without disrupting live editors
- Each sync creates a comprehensible commit history
- External changes integrate as collaborative edits, not overwrites

### 3. Comments That Survive
**Intent**: Preserve conversation context through document evolution
- Comments use Automerge cursors to move with text edits
- Orphaned comments (where text was deleted) remain visible
- Comments are data, not decorations - they persist with the document
- Character-range anchoring ensures comments stay relevant

### 4. Security Through Simplicity
**Intent**: Appropriate security for the deployment context
- Single API key for prototype deployment (acknowledged limitation)
- Relies on deployment-level protection (Vercel password)
- Explicit trade-off: simplicity over granular security
- Clear path to proper authentication when needed

## Architectural Intents

### Dual Storage Strategy
**Why**: Balance real-time performance with traditional REST compatibility
- SQLite for document metadata and quick REST access
- Automerge binary storage for CRDT operations
- Documents exist in both forms, synchronized automatically
- REST API remains simple while WebSocket handles complexity

### WebSocket Duality
**Why**: Separate concerns between document sync and user presence
- Automerge sync protocol on native WebSocket (`/automerge-sync`)
- Socket.io for presence, cursors, and awareness
- Clean separation allows independent scaling
- Each protocol optimized for its use case

### Frontend Transparency
**Why**: Make collaborative features feel native, not added
- No edit buttons - clicking a document enables editing
- No save buttons - changes persist automatically
- Connection indicators are subtle, not alarming
- Errors are handled gracefully with user-friendly messages

## Remixability Patterns

### Surface Level Remixing
- Change markdown rendering styles
- Modify UI components and layouts
- Adjust color schemes and themes
- Replace authentication mechanism
- Customize git commit messages

### Workflow Level Remixing
- Add approval workflows before git sync
- Implement role-based editing permissions
- Create threaded comments
- Add export formats beyond markdown
- Integrate with different version control systems

### Purpose Level Remixing
This architecture could become:
- **Code Review Tool**: Comments become review comments, git integration becomes PR creation
- **Knowledge Base**: Add search, tags, and cross-references
- **Meeting Notes**: Add real-time transcription and action items
- **Documentation System**: Add navigation, versioning, and publishing
- **Creative Writing Platform**: Add character tracking, outline tools

## Technical Decisions and Their Intents

### Automerge Over Operational Transform
**Intent**: Correctness and simplicity over optimization
- CRDTs guarantee consistency without central authority
- No server-side resolution logic needed
- Works offline and syncs when reconnected

### SQLite Over PostgreSQL
**Intent**: Reduce operational complexity
- Single file database fits serverless model
- No connection pooling complexity
- Easy backup and restore
- Sufficient for document metadata

### Express Over Next.js API Routes
**Intent**: Clear separation of concerns
- API can scale independently
- WebSocket support is first-class
- Easier to reason about real-time features
- Can be deployed anywhere, not just Vercel

### CodeMirror Over Other Editors
**Intent**: Maximum extensibility for collaborative features
- First-class support for decorations and extensions
- Automerge integration already exists
- Handles large documents efficiently
- Professional code editing features included

## Future Intent Trajectories

### Near-term Evolution
1. **User Presence**: Visible cursors and active user indicators
2. **Undo/Redo**: User-specific action history
3. **Git Pull**: Integrate external changes as collaborative edits
4. **Comment Threading**: Replies and resolutions

### Medium-term Possibilities
1. **Document Permissions**: Reader/writer/commenter roles
2. **Workspaces**: Group documents into projects
3. **Search**: Full-text search across documents
4. **Templates**: Reusable document structures

### Long-term Vision
1. **Federation**: Multiple TnyOffice instances that sync
2. **Plugins**: Extensible with custom behaviors
3. **AI Integration**: Suggested edits, auto-completion
4. **Mobile**: Native apps with offline support

## Success Metrics for Intent

This software succeeds when:
1. Users stop thinking about saving or conflicts
2. Teams naturally collaborate without coordination
3. Comments become conversations, not annotations
4. Git history tells a story, not just changes
5. Developers can understand and modify the system
6. The architecture can transform into new purposes

## Attribution and Lineage

This intent builds upon:
- **Automerge**: The CRDT technology enabling conflict-free collaboration
- **Google Docs**: The vision of real-time collaborative editing
- **Git**: The value of version history and branching
- **Markdown**: The simplicity of plain text with formatting
- **Open Source**: The belief that tools should be transparent and modifiable

## Open Questions for Remixers

When adapting this intent, consider:
1. What is your trust model? (Single team vs. public internet)
2. What is your persistence model? (Ephemeral vs. permanent)
3. What is your collaboration model? (Real-time vs. asynchronous)
4. What is your content model? (Markdown vs. rich text vs. code)
5. What is your deployment model? (Serverless vs. traditional)

## Intent License

This intent document is part of the project's open source commitment. When remixing:
- Preserve the attribution chain
- Document your intent modifications
- Share how the original intent evolved
- Contribute learnings back to the community

---

*This document captures the "why" behind TnyOffice. The code is merely one expression of these intents. Alternative implementations that preserve these intents are equally valid expressions of the TnyOffice idea.*