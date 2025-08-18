# Building TnyOffice: A Weekend Sprint from Vision to Reality

## The Genesis: Friday Evening, July 19, 2025

It started with a simple intuition shared with ChatGPT: "There needs to be something like Google Docs for markdown." 

Not a technical specification or business plan—just a feeling that something was missing in how we create and collaborate on technical documentation. The response crystallized this vague intuition into concrete product thesis:

> "A multiplayer Markdown workspace that feels like Google Docs, round-trips like Git, and publishes like a static site generator—without leaving the editor."

The gap was clear: While markdown had become the lingua franca for technical writing—READMEs, specs, documentation—it was stuck in single-player mode. Teams either got great solo tools (Obsidian, Typora) or abandoned markdown entirely for proprietary formats (Notion, Google Docs). The doc-as-code movement needed a bridge—something that let documentation live next to code while allowing non-technical contributors to participate without learning git.

ChatGPT didn't sugarcoat the technical challenges:
- Track changes on plain text without proprietary formats
- Rich features while maintaining markdown simplicity
- Real-time collaboration requiring CRDTs or Operational Transforms
- Competition from "good enough" existing tools

The MVP vision emerged surprisingly concrete: CodeMirror 6 + Yjs/Automerge for real-time collaboration, clean publishing to static HTML, perfect import/export with no lock-in, and comments anchored to AST nodes rather than character positions.

## Hour 1: The Monorepo Foundation (6:41 PM)

Fresh from the brainstorm, I opened Claude Code: "This will be a monorepo with multiple separate but related Next.js apps."

The architecture crystallized around a fundamental decision—where should shared API routes live? Instead of duplicating routes or creating complex packages, we built a dedicated API service:

```
tnyOffice/
├── apps/
│   ├── api/        # Centralized API service
│   └── docs/       # Documentation app
└── packages/       # Shared utilities
```

A small friction point revealed AI assumptions: Claude created the structure perfectly but gave each app its own git repository. "I don't like that," I said. We wanted a single git repo for the monorepo. The fix was quick, but the lesson was important—AI tools make reasonable assumptions based on common patterns, but your specific needs might differ.

The session progressed methodically. First, a plan at `/apps/api/plans/init_api_plan.md`. Then immediate implementation. Storage utilities, Zod validation schemas, three REST endpoints—all in under an hour.

But instead of just building an API, I asked for something more: "Replace the page.tsx with API documentation UI along with a way to test API calls right from that doc page." The result was surprisingly sophisticated—a fully interactive API documentation with tabbed interface, live testing, response visualization, and dark mode support.

## Hour 2: Infrastructure Details (8:40 PM)

Friday evening continued with a focus on the small details that matter. I shared a screenshot of a simple logging wrapper: "Let's think about a slightly better logging approach than console.log. It should be the same approach across the monorepo."

The implementation was deliberately simple—checking NODE_ENV before outputting. But the decision to make it a shared package from day one revealed the monorepo's power:
- Consistency by default
- Single source of truth
- Clear boundaries

"Make sure we do good linting for this project," I requested. "Catch all the linting errors that could stop a Vercel deployment." What followed was methodical: root-level ESLint, TypeScript checking, Turbo.json for orchestrating tasks, scripts that would catch issues before deployment.

These weren't glamorous additions. We didn't add user-facing features or solve complex challenges. But these small decisions compound—the logger becomes the foundation for observability, linting becomes the safety net for rapid iteration, shared packages become the template for extracting functionality.

## Hour 3: Real-Time Ambitions (8:45 PM)

Minutes after setting up the logger, I dropped ambitious specifications: "We want real-time multi-author update capabilities." The vision invoked cr-sqlite, WebSockets, and CRDTs: "Browser client ↔ WebSocket ↔ cr-sqlite backend."

Claude created a comprehensive three-week plan with six phases. "Update it because there's no need to maintain backward compatibility. We're prototyping." The plan immediately slashed to 3.5 days, simple steps, with all the complex migration strategies vanishing.

Twenty minutes in, I made another decisive call: "Create a new basic nodejs app called api2. It's not a Next app. Keep it simple." No Next.js, no App Router—just Express and SQLite.

This session revealed something important about building prototypes: Sometimes you need to build it twice to build it right. The first API taught us the domain model. The second would teach us about persistence. Neither was wrong—both were necessary steps.

## Hour 4: Late Night Deploy (11:37 PM)

Three hours after starting api2, I returned: "Let's do step 1 of this plan." The Express API was now deployed on Fly.io, SQLite database working, after overcoming deployment challenges with monorepo dependencies and TypeScript compilation.

Step 1 added a PUT endpoint for updating files. "Can you include this new endpoint in testing page?" Then: "Now let's change @apps/docs/ to take advantage of this, with editing ability and a save button." The read-only markdown viewer transformed into a full editor with Edit/Cancel/Save functionality.

"Let's move on to step 2. We don't need a migration script. If you find a database that's not using cr-sqlite just delete and recreate." This was the moment the real-time dream started becoming concrete. But then, an error:

```
npm error import pkg from "./package.json" assert { type: "json" };
```

The cr-sqlite integration hit a wall. It was approaching midnight. We had a deployed API with full CRUD operations, a frontend with edit/save functionality, but not yet real-time synchronization. The session ended with an npm error—a reminder that even the best-laid plans encounter reality.

## Day 2: The Automerge Pivot (Saturday, 6:28 AM)

Saturday morning brought a different approach: "Create a new plan called automerge_plan.md that uses @automerge/automerge-codemirror."

The pivot from cr-sqlite to Automerge. Claude didn't just read the npm package—it fetched actual source code from GitHub, understanding the bidirectional sync mechanism, reconciliation flags, and patch application process.

The comprehensive plan covered everything in three phases:
1. Backend Infrastructure: WebSockets, Automerge documents, binary storage
2. Frontend Integration: CodeMirror plugin, document handles, sync protocol  
3. Synchronization Protocol: Loading flows, real-time sync, persistence

Timeline: 1.5-2 weeks for MVP. Success metrics: sub-100ms sync latency, 10+ concurrent editors. Every section addressed real problems—offline/online transitions, server restarts with active connections, document size limits.

## The WASM Discovery (6:50 AM)

Twenty-two minutes later, I needed deeper understanding: "Help me understand where Automerge is using WASM in a scenario like a Next.js app as frontend and plain Node API backend."

The research uncovered elegant architecture: **Automerge's core CRDT logic is written in Rust and compiled to WebAssembly.** This single design decision cascaded into everything—high performance, cross-platform compatibility, memory safety, consistent behavior everywhere.

The package architecture revealed layers:
```
@automerge/automerge         (High-level JavaScript API)
    ↓
@automerge/automerge-wasm    (Low-level WASM bindings)
    ↓
Rust core compiled to WASM   (The actual CRDT magic)
```

Frontend required bundler configuration for WASM initialization. Backend just worked—Node.js treated WebAssembly like any other module. The same code everywhere, no separate implementations.

## The Implementation Marathon (7:02 AM)

With architecture understood, implementation began. Claude dove straight in:
- SQLite storage adapter for Automerge persistence
- Document service for format conversion
- WebSocket server with dual setup
- Updated REST endpoints using Automerge documents

Then came the frontend battle. Error after error:
- "Cannot read properties of undefined (reading 'isReady')"
- "handle.doc is not a function"
- "docHandle.whenReady is not a function"

Finally, I provided the actual example. The solution was simpler than all attempts:
```typescript
const syncPlugin = automergeSyncPlugin({
  handle,
  path: ['content'],
});
```

"Great! That works."

With collaboration working, I simplified: "We don't need read-only or Edit modes anymore. Just always be in Collaborate mode." Every document became collaborative by default. Edit buttons disappeared. Save buttons vanished. Just real-time sync, all the time.

## Deployment and WebSockets (7:56 AM)

"Now it's time to update our deployment and get this new version up on Fly." But first, TypeScript compilation revealed eleven errors. The code worked perfectly with `npm run dev`, but strict compilation caught every type mismatch.

Claude methodically fixed each—adding awaits, letting TypeScript infer mutable proxies, fixing import statements. Build successful.

The deployment hit configuration conflicts with WebSocket support. "I just deleted the tny-office-api app in the Fly dashboard. Help me deploy from scratch." Sometimes the cleanest solution is starting fresh.

Deployment succeeded, but: "WebSocket connection to 'ws://localhost:3001/automerge-sync' failed." The frontend was still trying localhost! Quick fix with environment variable:
```bash
NEXT_PUBLIC_WS_URL=wss://tny-office-api.fly.dev/automerge-sync
```

By 8:00 AM Saturday, TnyOffice was live with real-time collaboration working across the internet.

## Feature Evolution: Git, Comments, and Complex Problems

### Git Integration (8:35 AM)
"Let's make a specific plan for git integration." The vision: Every document in the database should also exist in a git repository. The strategy was elegantly simple—use `{id}-{filename}` for stable paths, one sync endpoint to determine changes and commit.

### Comments Implementation (12:08 PM)
"We're going to make a plan for commenting capabilities." I shared a detailed Google Docs-style proposal, but Claude had learned: "Remember this is a solid prototype. Make simple, straightforward plans."

Three endpoints for comments. Yellow highlights in text. Simple sidebar. No threads, no replies, no permissions. Just comments.

The magic: Comments synced automatically through Automerge. No separate database table, no WebSocket messages, no position recalculation. CRDTs handled everything.

### The Hard Problems (12:24 PM)
Two architectural questions tested TnyOffice's foundations:

**Git Pull**: "What happens when someone edits a document in git while others are editing it live?" The naive approach would replace entire documents. The sophisticated solution treated git changes as collaborative edits—calculating differences, converting to operations, letting CRDTs handle conflicts.

**Undo/Redo**: User-specific history, patch-based storage, scope support for text vs comments. The hardest challenge: maintaining comment positions through undo operations.

These weren't just features—they were fundamental challenges requiring deep architectural thinking.

## Security and Polish (Saturday Evening)

### The Security Wake-Up (8:15 PM)
"It's a prototype but it'll have some of our real data so we don't want it open on the internet."

Claude's audit revealed uncomfortable truth: API completely open, no authentication, CORS accepting any origin. Anyone could create, read, update, delete any document.

The solution was beautifully minimal: Single API key authentication. One key, shared secret, problem solved. Implementation took less than an hour but prevented countless potential problems.

### The Delete Feature (9:59 PM)
"Add an API endpoint for deleting a document." Claude's response was systematic—first understand existing patterns, then implement. The delete endpoint was comprehensive, handling database cleanup, Automerge document removal, error resilience.

The testing interface evolved alongside, with confirmation dialogs preventing accidental deletions and visual language of danger—red means destructive.

## The Architecture That Emerged

After 28 hours of building, TnyOffice had transformed from vision to working system:

**The Technical Stack:**
- Monorepo with Next.js apps and shared packages
- Express API with SQLite persistence
- Automerge CRDTs for conflict-free collaboration
- CodeMirror 6 for rich editing
- WebSockets for real-time sync
- Git integration for version control
- Deployed on Fly.io and Vercel

**The Features:**
- Real-time collaborative editing
- Comments with automatic position tracking
- Git sync with diff-based merging
- Undo/redo with user-specific history
- API authentication
- Interactive documentation

**The Philosophy:**
- Start simple, build incrementally
- Choose the right primitives (CRDTs for collaboration)
- Let technology shape architecture
- External changes should feel like collaboration
- Every decision considers production

## The Patterns and Lessons

### Development Rhythm
- **Friday evening**: Dream and plan
- **Friday night**: Build and hit walls
- **Saturday morning**: Research and understand
- **Saturday afternoon**: Extend and integrate
- **Saturday evening**: Secure and polish

### Key Insights
1. **Build it twice to build it right** - First API taught domain model, second taught persistence
2. **Small decisions compound** - Logger becomes observability, linting becomes safety net
3. **Technology choice determines architecture** - CRDTs eliminated entire categories of problems
4. **Local-first with eventual consistency** - Each user edits their copy, all converge to same state
5. **Simple interfaces hiding sophisticated implementation** - Delete isn't just removing a row

### The Meta-Level
This wasn't just about building an editor. It was about:
- Understanding the problem space deeply
- Choosing foundations that make hard things possible
- Building incrementally with clear boundaries
- Thinking production from day one
- Learning from each failure and pivot

## The Result

In one weekend, TnyOffice evolved from "GDocs for markdown" intuition to a working system with:
- True real-time collaboration without conflicts
- Clean markdown that round-trips perfectly
- Git integration for version control
- Comments that survive document changes
- Production-ready security
- Deployment infrastructure

The dream from Friday evening was now a URL anyone could visit. Not through grand features, but through careful additions that each made the whole more complete.

The prototype had become something more—a demonstration that with the right foundations, modern tools, and focused execution, complex collaborative systems can emerge from simple beginnings.

## Epilogue: The Continuing Story

This weekend sprint wasn't the end—it was the beginning. Each feature revealed new possibilities, each implementation taught new lessons. The gap between single-player markdown and collaborative documentation had been bridged.

TnyOffice proved that the intuition was right: There did need to be something like Google Docs for markdown. And now, there was.

---

*Built in 28 hours across July 19-20, 2025*  
*From vision to deployed reality*  
*A testament to the power of modern tools, AI assistance, and focused execution*