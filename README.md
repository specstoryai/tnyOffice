# TnyOffice Monorepo

A monorepo containing multiple Next.js applications with shared functionality.

## Structure

```
tnyOffice/
├── apps/
│   ├── api/        # Centralized API service
│   └── docs/       # Collaborative markdown docs app (like GDocs)
├── packages/
│   ├── logger/     # Shared logging utility
│   ├── shared/     # Shared utilities and types
│   └── ui/         # Shared UI components
└── package.json    # Workspace configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 10+

### Installation
```bash
npm install
```

### Development
Run all apps in development mode:
```bash
npm run dev
```

### Building
Build all apps:
```bash
npm run build
```

## Apps

### API Service (`apps/api`)
Centralized API for file management and shared backend functionality.

### Documentation (`apps/docs`)
Collaborative markdown docs app (like GDocs).

## Adding New Apps

1. Navigate to the apps directory
2. Create a new Next.js app:
   ```bash
   cd apps
   npx create-next-app@latest my-app
   # or with shadcn/ui
   npx shadcn@latest init
   ```

## Packages

### Logger (`packages/logger`)
A simple, environment-aware logging utility that provides consistent logging across all apps.

Usage:
```typescript
import { log } from '@tnyoffice/logger';

log.info('Fetching user data', userId);
log.error('Failed to fetch', error);
```

## Workspace Management

This monorepo uses npm workspaces. All apps and packages share dependencies at the root level when possible.

### Running Commands
- All apps: `npm run dev`
- Specific app: `npm run dev --workspace=apps/api`

## Contributing

1. Create feature branches from `main`
2. Follow existing code patterns
3. Ensure all apps build successfully before committing