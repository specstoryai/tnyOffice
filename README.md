# TnyOffice Monorepo

A monorepo containing multiple Next.js applications with shared functionality.

## Structure

```
tnyOffice/
├── apps/
│   ├── api/        # TypeScript Node.js API with SQLite storage
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
Real-time collaborative markdown editor API with TypeScript, Express, SQLite, and Automerge CRDTs. Features:
- **WebSocket support** for real-time collaboration via Automerge sync
- **SQLite database** with persistent volume for data storage
- **REST API** for CRUD operations on markdown files
- **Automatic conflict resolution** using CRDT technology
- **Deployed on Fly.io** with WebSocket support

**URLs:**
- Local: `http://localhost:3001`
- Production: `https://tny-office-api.fly.dev`
- WebSocket: `wss://tny-office-api.fly.dev/automerge-sync`

### Documents (`apps/docs`)
Next.js collaborative markdown editor (like Google Docs) with real-time sync. Features:
- **Real-time collaboration** using Automerge CRDTs
- **WebSocket connection** to API for instant updates
- **Document list** with create/edit capabilities
- **Markdown preview** with side-by-side editing

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://tny-office-api.fly.dev
NEXT_PUBLIC_WS_URL=wss://tny-office-api.fly.dev/automerge-sync
```

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

## Deployment

### API Deployment to Fly.io

The API service is deployed on Fly.io with WebSocket support and persistent SQLite storage.

#### Prerequisites
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- Authenticated with `fly auth login`

#### Initial Deployment
```bash
cd apps/api

# Create new app (one-time setup)
fly launch --no-deploy
# Choose app name, region, NO to Postgres/Redis

# Create persistent volume for SQLite
fly volumes create data --size 1 --region bos

# Deploy
fly deploy
```

#### Updating Deployment
```bash
cd apps/api
fly deploy
```

#### Monitoring
```bash
# View logs
fly logs

# Check status
fly status

# SSH into container
fly ssh console
```

#### Configuration
The `fly.toml` is configured for:
- WebSocket support on `/automerge-sync`
- Persistent volume mounted at `/data`
- Auto-scaling with minimum 1 instance for WebSocket connections
- HTTPS with automatic certificates

### Frontend Deployment

The docs app can be deployed to Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://tny-office-api.fly.dev
   NEXT_PUBLIC_WS_URL=wss://tny-office-api.fly.dev/automerge-sync
   ```

## Contributing

1. Create feature branches from `main`
2. Run `npm run check-all` before committing to ensure:
   - All TypeScript types are correct
   - ESLint rules pass
   - Code follows project conventions
3. Use the logger package instead of `console.log`
4. Ensure all apps build successfully before creating PRs