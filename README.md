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

**Log Levels:**
- `log.info()` - General information messages (hidden in production)
- `log.debug()` - Detailed debugging information (hidden in production)
- `log.warn()` - Warning messages (hidden in production)
- `log.error()` - Error messages (always visible, even in production)

**Environment-based Behavior:**
The logger automatically adjusts its output based on the `NODE_ENV` environment variable:
- **Development** (`NODE_ENV !== 'production'`): All log levels are visible
- **Production** (`NODE_ENV === 'production'`): Only `error` logs are visible

Usage:
```typescript
import { log } from '@tnyoffice/logger';

log.info('Fetching user data', userId);      // Visible in dev, hidden in prod
log.debug('Request payload:', data);         // Visible in dev, hidden in prod
log.warn('API rate limit approaching');      // Visible in dev, hidden in prod
log.error('Failed to fetch', error);         // Always visible
```

To run in production mode locally:
```bash
NODE_ENV=production npm run start
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