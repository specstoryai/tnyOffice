# Markdown File API Plan

## Overview
Dead simple create/read API for markdown files with clean, versioned routes.

## API Structure

### Base URL
`/api/v1`

### Endpoints

#### 1. Create Markdown File
- **POST** `/api/v1/files`
- **Body**: 
  ```json
  {
    "filename": "example.md",
    "content": "# Markdown content here"
  }
  ```
- **Response**: 
  ```json
  {
    "id": "uuid",
    "filename": "example.md",
    "createdAt": "2024-01-01T00:00:00Z",
    "size": 1234
  }
  ```

#### 2. Get Markdown File
- **GET** `/api/v1/files/:id`
- **Response**: 
  ```json
  {
    "id": "uuid",
    "filename": "example.md",
    "content": "# Markdown content here",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "size": 1234
  }
  ```

#### 3. List Files
- **GET** `/api/v1/files`
- **Query Parameters**: 
  - `limit` (default: 20)
  - `offset` (default: 0)
- **Response**: 
  ```json
  {
    "files": [
      {
        "id": "uuid",
        "filename": "example.md",
        "createdAt": "2024-01-01T00:00:00Z",
        "size": 1234
      }
    ],
    "total": 100,
    "limit": 20,
    "offset": 0
  }
  ```

## Implementation Details

### File Storage
- Store files in `storage/markdown/` directory
- Use UUID for file IDs
- Save metadata in a simple JSON database or SQLite

### Error Handling
- 400: Invalid request body
- 404: File not found
- 500: Server error

### Validation
- Filename: Required, alphanumeric with dashes/underscores, .md extension
- Content: Required, valid UTF-8 text
- Max file size: 5MB

### Security
- Input sanitization
- Path traversal prevention
- Rate limiting

### Future Considerations
- Update endpoint (PUT)
- Delete endpoint (DELETE)
- Search functionality
- File versioning
- Authentication/authorization