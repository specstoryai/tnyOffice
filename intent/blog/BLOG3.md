# Building TnyOffice: The Small Details That Matter

## Part 3: Beyond Console.log

*July 19, 2025, 8:40 PM EDT*

Friday evening, just a couple hours after setting up the monorepo, I shared a screenshot with Claude—a simple logging wrapper that checked `NODE_ENV` before outputting to console. "Let's think about a slightly better logging approach than console.log," I said. "It should be the same approach across the monorepo."

This wasn't about building complex logging infrastructure. It was about recognizing that even in a prototype, certain patterns set the foundation for everything that follows.

## The Logger That Respects Production

The implementation was deliberately simple:

```typescript
const isProd = process.env.NODE_ENV === 'production'

export const log = {
  info: (...args: any[]) => {
    if (!isProd) console.info('[INFO]', ...args)
  },
  warn: (...args: any[]) => {
    if (!isProd) console.warn('[WARN]', ...args)
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },
  debug: (...args: any[]) => {
    if (!isProd) console.debug('[DEBUG]', ...args)
  },
}
```

What made this interesting wasn't the code—it's about as basic as logging gets. It was the decision to make it a **shared package** from day one.

## The Monorepo Philosophy in Action

Claude immediately understood the assignment. Instead of adding logging utilities to each app individually, we created `packages/logger`—a shared package that both the API and docs apps could import as `@tnyoffice/logger`.

This small decision revealed the monorepo's power:
- **Consistency by default**: Every app logs the same way
- **Single source of truth**: One place to update logging behavior
- **Clear boundaries**: Apps consume packages, they don't share code directly

## The Linting Crusade

"Make sure we do good linting for this project," I requested. "Set up linting across the monorepo in such a way that we catch all the linting errors that could stop a Vercel deployment."

What followed was a methodical setup:
1. Root-level ESLint configuration
2. TypeScript checking across all packages
3. Turbo.json for orchestrating tasks
4. Scripts that would catch issues before deployment

Claude found and flagged every `console.log` statement across the codebase, replacing them with the new logger. It caught TypeScript any-types that would fail strict builds. It set up ignore patterns for generated files.

## The Philosophy of Small Things

This session wasn't glamorous. We didn't add any user-facing features. We didn't solve any complex technical challenges. We just:
- Replaced console.log with a environment-aware logger
- Set up proper linting and type checking
- Created our first shared package

But these small decisions compound. The logger that respects production becomes the foundation for proper observability. The linting that catches deployment issues becomes the safety net for rapid iteration. The shared package pattern becomes the template for extracting common functionality.

## The Hidden Architecture

Looking at the monorepo structure after this session:

```
tnyOffice/
├── apps/
│   ├── api/        # Uses @tnyoffice/logger
│   └── docs/       # Uses @tnyoffice/logger
├── packages/
│   └── logger/     # Shared logging utility
└── turbo.json      # Orchestrates builds, linting, type checking
```

Each piece had a purpose. Each boundary was intentional. The architecture was emerging not from a grand design document, but from small, practical decisions.

## The Vercel Consideration

Throughout the session, there was an undercurrent: "catch all the linting errors that could stop a Vercel deployment." This wasn't academic. The code needed to deploy cleanly, build without errors, run in production.

The linting wasn't about code style—it was about deployment reliability. The TypeScript checking wasn't about type purity—it was about runtime safety. The logger wasn't about debugging—it was about not leaking development logs to production.

## The Pattern Emerges

Three sessions in, a pattern was becoming clear:

1. **Start simple**: Basic API, basic UI, basic logging
2. **Extract commonality**: Shared packages for shared concerns
3. **Add guardrails**: Linting, types, environment awareness
4. **Think deployment**: Every decision considers production

But we still hadn't tackled the core challenge: real-time collaboration. The foundation was solid, the patterns were established, but the documents were still static files in a SQLite database.

The next session would change everything. It would introduce Automerge, WebSockets, and the complexity of distributed state. But it would build on this foundation—the logger would track sync operations, the linting would catch WebSocket issues, the monorepo structure would contain the complexity.

*To be continued...*

---

*Next: "We have an API and a UI, let's make this real-time" - The two-week odyssey into CRDTs, WebSocket adapters, and why making save buttons disappear is harder than it looks.*