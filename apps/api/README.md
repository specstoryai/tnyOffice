# TnyOffice API Service

A TypeScript Node.js API service using Express and SQLite for file storage, providing centralized file management for the TnyOffice monorepo.

## Overview

This is a TypeScript Node.js application that:
- Written in TypeScript with strict type checking
- Uses Express 5.1.0 for the web framework
- Uses better-sqlite3 12.2.0 for database operations
- Uses nodemon + tsx for development with hot reloading
- Stores markdown files in SQLite instead of the filesystem
- Provides the same REST API endpoints as the main API service

## Getting Started

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

### Available Endpoints

- `POST /api/v1/files` - Create a new markdown file
- `GET /api/v1/files` - List all files with pagination
- `GET /api/v1/files/:id` - Get a specific file by ID

## Database

The SQLite database is automatically created at `database.db` when the server starts. The schema includes:

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
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
```

## Implementation Details

- **Database**: SQLite with better-sqlite3 for synchronous operations
- **IDs**: UUIDs generated with uuid package
- **Validation**: Zod schemas for input validation
- **Logging**: Uses @tnyoffice/logger for consistent logging
- **CORS**: Enabled for cross-origin requests