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
Centralized API for file management and shared backend funDocumentation application
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

This monorepo uses npm workspaces and Turbo for efficient builds and development.

### Running Commands
- **Development**: `npm run dev` - Runs all apps concurrently
- **Building**: `npm run build` - Builds all apps
- **Linting**: `npm run lint` - Runs ESLint across all workspaces
- **Type Checking**: `npm run typecheck` - Runs TypeScript type checking
- **Full Check**: `npm run check-all` - Runs both lint and typecheck

### Specific Workspace Commands
Run commands for a specific app:
```bash
npm run dev -w api      # Run only the API app
npm run lint -w docs    # Lint only the docs app
```

## Code Quality

### ESLint Configuration
The monorepo enforces strict linting rules to ensure code quality and prevent deployment issues:
- TypeScript strict mode
- No unused variables (prefix with `_` to ignore)
- No `any` types
- No `console.log` (use the logger package instead)
- Enforces `const` over `let` when possible

### TypeScript Configuration
- Strict type checking enabled
- No implicit `any`
- Unused locals and parameters are errors
- Consistent casing in file names required

## Contributing

1. Create feature branches from `main`
2. Run `npm run check-all` before committing to ensure:
   - All TypeScript types are correct
   - ESLint rules pass
   - Code follows project conventions
3. Use the logger package instead of `console.log`
4. Ensure all apps build successfully before creating PRs