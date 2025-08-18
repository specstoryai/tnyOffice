# Building TnyOffice: From Vision to First API

## Part 2: The Monorepo Foundation

*July 19, 2025, 6:41 PM EDT*

Fresh from the ChatGPT brainstorm, I opened Claude Code with a simple request: "This will be a monorepo with multiple separate but related Next.js apps."

The conversation quickly revealed a fundamental architectural decision that would shape everything: **Where should shared API routes live?**

Claude initially suggested the typical patterns—shared packages, reusable utilities. But I had something specific in mind: "If I have shared API for persisting and retrieving files that's used across all the apps?"

That's when the architecture crystallized. Instead of duplicating API routes across apps or creating complex shared packages, we'd build a **dedicated API service**—a standalone Next.js app that would handle all file operations for the entire ecosystem.

```
tnyOffice/
├── apps/
│   ├── api/        # Centralized API service
│   └── docs/       # Documentation app
└── packages/       # Shared utilities
```

## The Git Repository Dance

One of those moments that reveals the AI's assumptions: Claude created the monorepo structure perfectly, but when I checked, each app had its own git repository. 

"I don't like that," I told Claude. "We want a single git repo for the monorepo."

This small friction point highlighted something important about working with AI tools—they make reasonable assumptions based on common patterns (many monorepos do have separate git repos), but your specific needs might differ. The fix was quick: remove the individual `.git` folders, initialize a single repo at the root, and create a proper `.gitignore` for the monorepo.

## From Plan to Implementation

What struck me about this session was the methodical approach. First, we created a plan—literally a markdown file at `/apps/api/plans/init_api_plan.md`:

```markdown
# Markdown File API Plan

## Overview
Dead simple create/read API for markdown files with clean, versioned routes.

### Base URL
`/api/v1`

### Endpoints
- POST /api/v1/files - Create markdown file
- GET /api/v1/files/:id - Get file by ID
- GET /api/v1/files - List all files
```

Then, in the same session, we implemented it. Not tomorrow, not after a design review—immediately. The storage utilities, validation schemas with Zod, and all three endpoints came together in under an hour.

## The Interactive Documentation Twist

But here's where it got interesting. Instead of just building an API, I asked Claude to "replace the page.tsx of the initial Next.js app with a new page that offers basic and simple API documentation UI along with a way to test API calls right from that doc page."

The result was surprisingly sophisticated—a fully interactive API documentation page with:
- Tabbed interface for different endpoints
- Live testing capabilities
- Response visualization with timing metrics
- Dark mode support
- Inline validation rules and error codes

This wasn't in the original plan. It emerged from the conversation, from the back-and-forth of "what if we could test it right here?"

## The Power of Incremental Decisions

Looking back at this session, what stands out is how each decision built on the previous one:

1. **Monorepo structure** → enables shared code without complexity
2. **Dedicated API service** → centralizes file operations
3. **Plan before code** → ensures clear intent
4. **Interactive documentation** → makes the API immediately usable

Each choice was small, reversible, and focused. We didn't try to build the entire collaborative editor in one session. We built a foundation—a simple API that could store and retrieve markdown files.

## The First Commit

The session ended with a git commit that captured it all:

```
Initial commit: TnyOffice monorepo setup

- Monorepo structure with apps/ and packages/ directories
- API service app for centralized file management
- Documentation app for collaborative markdown editing
- Workspace configuration with npm workspaces
- Basic README and gitignore
```

42 files changed, 7,564 insertions. The foundation was laid.

## The Missing Piece

But there was something conspicuously absent from this first implementation: **real-time collaboration**. The API could store files, retrieve them, list them—but it couldn't handle multiple users editing the same document simultaneously.

That would require something more sophisticated than REST endpoints. It would require WebSockets, CRDTs, and a complete rethinking of how documents are stored and synchronized.

The next morning, I'd return with a new question: "How do we make this collaborative?"

*To be continued...*

---

*Next: The journey into Automerge, why "just add WebSockets" wasn't enough, and the moment when two browsers finally synced in real-time.*