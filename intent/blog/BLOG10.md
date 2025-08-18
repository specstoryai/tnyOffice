# Building TnyOffice: Git All The Things

## Part 10: From Database to Repository

*July 20, 2025, 8:35 AM EDT*

After the successful deployment, a new requirement emerged: "let's make a specific plan for the git integration. write a new file in @apps/api/plans/ called git_plan.md that outlines our most basic and simple approach in this prototype for adding git capabilities."

The vision was clear: Every document in the database should also exist in a git repository. Add, update, delete—all tracked in git. First locally, then eventually pushed to GitHub.

## The Architecture Question

The plan started with a simple directive: "Initialize a bare git repo at `/data/git-repo` (persistent Fly.io volume)"

But then I asked Claude to check something important: "check what we do with the creation of the sqlite database on the filesystem.. does it differ for production (fly.io) vs local dev?"

The answer revealed thoughtful design:

```typescript
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/database.db'
  : path.join(__dirname, '../../database.db');
```

Production used the Fly.io persistent volume at `/data`. Development used a local path. The git repository would follow the same pattern.

## The Git Strategy

Claude's plan was elegantly simple:

### Repository Structure
```
/data/git-repo/
├── .git/
├── documents/
│   ├── {id}-{filename}  # e.g., "abc123-readme.md"
│   └── ...
└── .gitignore
```

Using `{id}-{filename}` solved multiple problems:
- No filename collisions
- Stable paths even if titles changed
- Easy mapping between database and filesystem

### The Sync Algorithm

```typescript
POST /api/v1/git/sync
```

One endpoint to rule them all:
1. Query all documents from SQLite
2. List all files in the git repository
3. Determine changes (new, modified, deleted)
4. Apply changes to filesystem
5. Create a single commit
6. Return sync status and commit hash

## The Implementation Details

The plan outlined using `simple-git` for Node.js git operations:

```typescript
interface GitSyncResult {
  success: boolean;
  commitHash?: string;
  changes: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  error?: string;
}
```

Every sync would produce a clear result—what changed and where it ended up.

## The Phased Approach

Claude wisely structured the implementation in phases:

**Phase 1 (Current Prototype)**
- Local git repository
- Manual sync endpoint
- Basic add/update/delete operations
- Single commit per sync

**Phase 2 (Near Future)**
- Automatic sync on document changes
- Individual commits per change
- Meaningful commit messages
- Git history endpoint

**Phase 3 (Remote Integration)**
- GitHub authentication
- Push to remote
- Pull from remote (with conflict resolution)
- Branch management

## The Technical Considerations

The plan addressed real-world concerns:

### Performance
- Initial sync might be slow with many documents
- Use git's built-in efficiency for incremental updates
- Consider batching for large repositories

### Security
- Sanitize filenames to prevent path traversal
- Limit file sizes to prevent abuse
- No sensitive data in commit messages

### Error Handling
- Validate git repository state before operations
- Handle file system errors gracefully
- Rollback strategy if commit fails

## The Philosophical Alignment

This git integration plan perfectly embodied the TnyOffice philosophy:

1. **Start simple** - One sync endpoint, basic operations
2. **Build incrementally** - Three clear phases
3. **Think production** - Persistent volumes, error handling
4. **Plan for scale** - GitHub integration path clear from day one

## The Bridge Between Worlds

What made this plan special wasn't just the git integration—it was bridging two paradigms:

- **Database world**: UUIDs, timestamps, relational data
- **Git world**: Files, commits, distributed version control

The `{id}-{filename}` naming was the key—maintaining database integrity while providing human-readable git history.

## The Saturday Morning Pattern

Looking at the clock—8:35 AM on a Saturday—the pattern was clear:
- Friday evening: Dream and plan
- Friday night: Build and deploy
- Saturday morning: Extend and integrate

Each session built on the last. The git integration wasn't a new feature—it was the natural evolution of a system that already knew how to persist, sync, and collaborate.

The documents weren't just in a database anymore. They were becoming part of a larger ecosystem—trackable, versionable, shareable.

*To be continued...*

---

*Next: Implementation begins. The first commit, the first sync, and why git makes everything better.*