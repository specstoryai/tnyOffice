# TnyOffice Monorepo

A monorepo containing multiple Next.js applications with shared functionality.

## Structure

```
tnyOffice/
├── apps/
│   ├── api/        # Centralized API service (Next.js, file-based)
│   ├── api2/       # Simple Node.js API with SQLite storage
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
Centralized API for file management and shared backend functionality. Built with Next.js and uses file-based storage.

### API2 Service (`apps/api2`)
Simple Node.js API service using Express and SQLite for database storage. Provides the same endpoints as the main API but with persistent database storage.

### Documents (`apps/docs`)
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

### Linting and Type Checking

This monorepo uses a comprehensive linting and type checking setup to catch errors before deployment:

#### ESLint Configuration
- **ESLint v9** with the new flat config format
- **TypeScript ESLint** for TypeScript-specific rules
- **Strict rules** to ensure code quality:
  - No unused variables (prefix with `_` to ignore)
  - No `any` types allowed
  - No `console.log` (use the logger package instead)
  - Enforces `const` over `let` when possible
  - Consistent code style across all packages

#### TypeScript Configuration
- **Strict mode** enabled for maximum type safety
- **No implicit `any`** - all types must be explicit
- **Unused locals and parameters** are treated as errors
- **Consistent casing** in file names required
- Each app/package has its own `tsconfig.json` extending from root

#### Running Checks
```bash
# Run all linting across the monorepo
npm run lint

# Run TypeScript type checking
npm run typecheck

# Run both lint and typecheck
npm run check-all

# Run everything including build (mimics Vercel deployment)
npm run check-build
```

#### Package-Specific Configuration
- **Next.js apps** use Next.js's built-in ESLint config with additional strict rules
- **Logger package** has custom ESLint config to allow console usage
- All packages use the latest versions:
  - ESLint v9.31.0
  - TypeScript v5.8.3
  - @typescript-eslint v8.37.0

#### Why This Matters
Vercel runs both linting and type checking during deployment. Our setup ensures:
1. **No deployment failures** due to type errors
2. **Consistent code quality** across the monorepo
3. **Early error detection** during development
4. **Production-ready code** with no debug logs

## Contributing

1. Create feature branches from `main`
2. Run `npm run check-all` before committing to ensure:
   - All TypeScript types are correct
   - ESLint rules pass
   - Code follows project conventions
3. Use the logger package instead of `console.log`
4. Ensure all apps build successfully before creating PRs