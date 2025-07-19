# TnyOffice API Service

Centralized API service for the TnyOffice monorepo, providing file management and shared backend functionality for all apps.

## Overview

This Next.js application serves as the dedicated API backend for:
- Markdown file storage and retrieval
- Shared authentication (future)
- Common data operations across all TnyOffice apps

## Live API Documentation

Visit [http://localhost:3001](http://localhost:3001) to access the interactive API documentation with live testing capabilities.

## API Documentation

See [plans/init_api_plan.md](./plans/init_api_plan.md) for the original API design.

### Base URL
- Development: `http://localhost:3001`
- Production: TBD

### Available Endpoints

#### v1 API
- `POST /api/v1/files` - Create a new markdown file
- `GET /api/v1/files/:id` - Retrieve a specific file
- `GET /api/v1/files` - List all files with pagination

## Getting Started

### Development

Run the development server:

```bash
npm run dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

### Building

```bash
npm run build
```

### Running in Production

```bash
npm run start
```

## Environment Variables

Create a `.env.local` file:

```env
# Storage configuration
STORAGE_PATH=./storage/markdown

# API configuration
API_VERSION=v1
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

## Project Structure

```
api/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── files/
│   │           ├── route.ts      # List and create
│   │           └── [id]/
│   │               └── route.ts  # Get by ID
│   └── page.tsx                  # API documentation page
├── lib/
│   ├── storage.ts                # File storage utilities
│   └── validation.ts             # Input validation
├── plans/
│   └── init_api_plan.md         # API design document
└── storage/                      # File storage directory
    └── markdown/
```

## Testing

### Using the Interactive Documentation

The easiest way to test the API is through the interactive documentation at [http://localhost:3001](http://localhost:3001).

### Using cURL

```bash
# Create a file
curl -X POST http://localhost:3001/api/v1/files \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.md", "content": "# Test Document\n\nThis is a test."}'

# Get a file by ID
curl http://localhost:3001/api/v1/files/{id}

# List files
curl http://localhost:3001/api/v1/files?limit=20&offset=0
```

## Security

- Input sanitization on all endpoints
- Path traversal protection
- File size limits (5MB default)
- UUID validation for file IDs
- Filename validation (alphanumeric with dashes/underscores, .md extension)
- Rate limiting (planned)

## Implementation Details

- **Storage**: Files are stored in the local filesystem under `storage/markdown/`
- **Metadata**: File metadata is stored in a JSON file for simplicity
- **IDs**: Files are identified by UUIDs
- **Validation**: Uses Zod for schema validation
- **Error Handling**: Consistent error responses with proper HTTP status codes
