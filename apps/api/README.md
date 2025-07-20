# TnyOffice API Service - Real-time Collaborative Markdown Editor

A TypeScript Node.js API service with real-time collaborative editing capabilities using Automerge CRDTs, Express, WebSocket, and SQLite for persistent storage.

## Overview

This is a production-ready TypeScript Node.js application that provides:
- **Real-time collaborative editing** using Automerge for conflict-free synchronization
- **WebSocket support** for instant updates across all connected clients
- **Dual storage system**: SQLite for metadata + Automerge binary storage
- **REST API** for traditional CRUD operations
- **Automatic conflict resolution** using CRDT technology
- **TypeScript** with strict type checking
- **Express 5.1.0** for the web framework
- **better-sqlite3 12.2.0** for database operations
- **Socket.io** for presence and awareness features

## Getting Started

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```bash
# Edit .env to add your remote repository URL (optional)
GIT_REMOTE_URL=https://github.com/username/repo.git

# For private repos, use a personal access token:
GIT_REMOTE_URL=https://username:token@github.com/username/repo.git
```

### Development

Run the development server with auto-reload:

```bash
npm run dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

### Production

```bash
npm run start
```

## API Endpoints

### Base URL
- Development: `http://localhost:3001`
- WebSocket: `ws://localhost:3001/automerge-sync`
- Socket.io: `ws://localhost:3001/socket.io/`

### REST Endpoints

#### Files API
- `POST /api/v1/files` - Create a new markdown file
- `GET /api/v1/files` - List all files with pagination
- `GET /api/v1/files/:id` - Get a specific file by ID (with Automerge sync)
- `PUT /api/v1/files/:id` - Update a file (creates/updates Automerge document)
- `GET /api/v1/files/:id/automerge` - Get Automerge document URL for real-time sync

#### Git API
- `POST /api/v1/git/sync` - Sync all documents to local git repository

### WebSocket Endpoints

- `/automerge-sync` - Automerge document synchronization (native WebSocket)
- `/socket.io/` - Presence, awareness, and custom events

## Database

The SQLite database is automatically created at `database.db` when the server starts. The schema includes:

### Files Table (Document Metadata)
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,  -- Cached for quick REST access
  automerge_id TEXT UNIQUE,  -- Links to Automerge document
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
)
```

### Automerge Storage Table (Binary CRDT Data)
```sql
CREATE TABLE automerge_storage (
  key TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
)
```

## Testing

### Using cURL

```bash
# Create a file
curl -X POST http://localhost:3001/api/v1/files \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.md", "content": "# Test Document\n\nThis is a test."}'

# List files
curl http://localhost:3001/api/v1/files?limit=20&offset=0

# Get a file by ID
curl http://localhost:3001/api/v1/files/{id}

# Update a file
curl -X PUT http://localhost:3001/api/v1/files/{id} \
  -H "Content-Type: application/json" \
  -d '{"filename": "updated.md", "content": "# Updated Document\n\nNew content."}'

# Sync documents to git
curl -X POST http://localhost:3001/api/v1/git/sync
```

## Real-time Collaboration

### How it Works

1. **Document Creation**: Regular markdown files are stored in SQLite
2. **First Edit**: Creates an Automerge document with CRDT structure
3. **Real-time Sync**: Changes propagate instantly via WebSocket
4. **Conflict Resolution**: Automerge automatically merges concurrent edits
5. **Persistence**: Binary CRDT data stored in SQLite for durability

### Architecture

```
Browser ↔ WebSocket ↔ Express Server ↔ Automerge Repo
                     ↔ REST API      ↔ SQLite Storage
```

## Git Integration

The API includes git synchronization capabilities to export all documents to a local git repository:

### Features
- Automatic git repository initialization
- Exports all documents as markdown files
- Tracks additions, modifications, and deletions
- Preserves document IDs in filenames to avoid conflicts
- Fetches latest content from Automerge for edited documents
- **Remote Push Support**: Automatically pushes to GitHub/GitLab when configured

### Git Repository Structure
```
# Production: /data/git-repo/
# Development: apps/api/git-repo/
git-repo/
├── .git/
├── documents/
│   ├── {id}-{filename}  # e.g., "abc123-readme.md"
│   └── ...
└── .gitignore
```

### Remote Repository Setup

To push changes to a remote repository:

1. **Create a GitHub repository** (can be private or public)
2. **Generate a Personal Access Token** with repo permissions
3. **Set the environment variable**:
   ```bash
   GIT_REMOTE_URL=https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
   ```

### Usage
```bash
# Sync all documents to git
curl -X POST http://localhost:3001/api/v1/git/sync

# Response
{
  "success": true,
  "commitHash": "a1b2c3d4...",
  "changes": {
    "added": ["123-readme.md"],
    "modified": ["456-spec.md"],
    "deleted": []
  },
  "pushedToRemote": true,
  "remoteUrl": "https://github.com/username/repo.git"
}
```

## Implementation Details

- **Database**: SQLite with better-sqlite3 for synchronous operations
- **Real-time**: Automerge 3.0 + Automerge Repo 2.1 for CRDT synchronization
- **WebSocket**: Native WebSocket for Automerge, Socket.io for presence
- **Git Integration**: simple-git for version control operations
- **IDs**: UUIDs generated with uuid package
- **Validation**: Zod schemas for input validation
- **Logging**: Uses @tnyoffice/logger for consistent logging
- **CORS**: Enabled for cross-origin requests
- **Storage Adapter**: Custom SQLite adapter for Automerge persistence

## Deployment

The API is designed to run on Fly.io with:
- Persistent volume for SQLite database
- WebSocket support for real-time features
- Environment variables for configuration