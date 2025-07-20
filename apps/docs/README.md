# TnyOffice Docs

A simple markdown document viewer and editor that connects to the TnyOffice API service.

## Overview

This Next.js application provides a clean interface for:
- Creating markdown documents
- Listing all documents
- Viewing documents with syntax highlighting using CodeMirror 6

## Getting Started

### Prerequisites

1. Make sure the API service is running on port 3001:
   ```bash
   cd ../api
   npm run dev
   ```

2. Configure the API endpoint (optional):
   Create or edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view the application.

## Features

- **Document List**: Browse all documents in the sidebar
- **Create Documents**: Click "New Document" to create markdown files
- **View Documents**: Click any document to view it with syntax highlighting
- **Auto-refresh**: Document list refreshes every 30 seconds
- **Responsive Design**: Works on mobile and desktop

## Technology Stack

- Next.js 15
- CodeMirror 6 for markdown editing
- Tailwind CSS for styling
- TypeScript

## Project Structure

```
docs/
├── app/
│   └── page.tsx          # Main application page
├── components/
│   ├── Layout.tsx        # Main layout with sidebar
│   ├── DocumentList.tsx  # Document list in sidebar
│   ├── DocumentViewer.tsx # Document viewer with CodeMirror
│   ├── CreateModal.tsx   # Modal for creating new documents
│   └── Editor.tsx        # CodeMirror wrapper component
└── plans/
    └── init_docs_plan.md # Implementation plan
```