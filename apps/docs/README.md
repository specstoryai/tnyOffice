# TnyOffice Docs - Real-time Collaborative Markdown Editor

A Next.js application with real-time collaborative editing capabilities, powered by Automerge CRDTs and CodeMirror 6.

## Overview

This Next.js 15 application provides a seamless collaborative editing experience:
- **Real-time collaborative editing** - Multiple users can edit simultaneously
- **Automatic conflict resolution** - Powered by Automerge CRDTs
- **Instant synchronization** - Changes appear in under 100ms
- **Zero configuration** - Just click a document and start editing
- **Connection status** - Visual indicators show sync status
- **Syntax highlighting** - Beautiful markdown editing with CodeMirror 6

## Getting Started

### Prerequisites

1. Make sure the API service is running on port 3001:
   ```bash
   cd ../api
   npm run dev
   ```

2. Configure the API endpoints (optional):
   Create or edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001/automerge-sync
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) to view the application.

## Features

### Core Features
- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Automatic Saving**: All changes are saved automatically via Automerge
- **Conflict-free Editing**: CRDT technology ensures no conflicts, even offline
- **Document List**: Browse all documents in the sidebar with auto-refresh
- **Create Documents**: Click "New Document" to create markdown files
- **Connection Status**: Green = connected, Yellow = connecting

### Collaborative Editing
- **Instant Sync**: Changes appear on all screens in under 100ms
- **No Save Button**: Everything is automatically persisted
- **Offline Support**: Edit offline, changes sync when reconnected
- **WebSocket Communication**: Efficient real-time updates

## Technology Stack

- **Next.js 15.4** with React 19.1
- **Automerge 3.0** for CRDT-based conflict resolution
- **Automerge Repo 2.1** for document synchronization
- **@automerge/automerge-codemirror** for editor integration
- **CodeMirror 6** for markdown editing
- **WebSocket** via BrowserWebSocketClientAdapter
- **Tailwind CSS** for styling
- **TypeScript 5.8**

## Project Structure

```
docs/
├── app/
│   ├── page.tsx                      # Main application page
│   └── layout.tsx                    # Root layout with AutomergeProvider
├── components/
│   ├── Layout.tsx                    # Main layout with sidebar
│   ├── DocumentList.tsx              # Document list with auto-refresh
│   ├── DocumentViewer.tsx            # Auto-collaborative document viewer
│   ├── CollaborativeEditor.tsx       # Real-time editor with Automerge
│   ├── ClientOnlyCollaborativeEditor.tsx # Next.js WASM wrapper
│   ├── CreateModal.tsx               # Modal for creating documents
│   └── Editor.tsx                    # Basic CodeMirror component
├── lib/
│   └── automerge/
│       ├── provider.tsx              # Automerge Repo provider
│       └── types.ts                  # TypeScript interfaces
└── plans/
    ├── init_docs_plan.md             # Initial implementation plan
    └── automerge_plan.md             # Automerge integration plan
```

## How It Works

1. **Open a Document**: Click any document in the sidebar
2. **Automatic Collaboration**: The app automatically enables real-time editing
3. **Type to Edit**: Your changes sync instantly to all viewers
4. **Connection Status**: Green dot = connected, yellow = connecting
5. **Test Collaboration**: Open the same document in multiple browser tabs

## Advanced Features

- **CRDT Technology**: Automerge ensures perfect conflict resolution
- **Binary Storage**: Efficient storage of document history
- **WebSocket Sync**: Low-latency updates via persistent connections
- **Offline Capable**: Edit offline, sync when reconnected
- **No Save Required**: All changes persist automatically