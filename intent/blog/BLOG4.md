# Building TnyOffice: The Real-Time Ambition

## Part 4: Reaching for Collaboration

*July 19, 2025, 8:45 PM EDT*

Just minutes after setting up the logger, I dropped a specification into Claude's context: "We want real-time multi-author update capabilities."

The ask was ambitious. I shared a plan for a "Real-Time Collaborative Markdown Editor Prototype" that invoked cr-sqlite, WebSockets, and CRDTs. The vision was clear:

> "Browser client ↔ WebSocket ↔ cr-sqlite backend"

Claude immediately understood the complexity and created a comprehensive plan—three weeks of implementation, six phases, from database layer to Git integration. It was thorough, professional, and exactly what you'd expect for a production system.

## The Reality Check

"Update it because there's no need to maintain backward compatibility with the existing API. We're prototyping."

That single comment changed everything. Claude immediately slashed the complexity:
- Three weeks became 3.5 days
- Six phases became simple steps
- Dual storage strategies disappeared
- Complex migration plans vanished

The revised plan focused on the essence: get multiple browsers editing the same document, use cr-sqlite's CRDT magic to handle conflicts, ship it.

## The Pivot to Simplicity

But even that wasn't simple enough. Twenty minutes into the conversation, I made a decisive call:

"Look at @README.md and @apps/api/README.md. We need to create a new basic nodejs app in this monorepo called api2. It's not a next app. Keep it simple."

No Next.js. No App Router. Just Express and SQLite.

Claude started building with sqlite3, but I pushed for modernity: "Use more up to date versions... better-sqlite3 12.2.0 instead of sqlite3."

## The Architecture Taking Shape

What emerged was interesting—a parallel API implementation:
- `apps/api` - The original Next.js API with file storage
- `apps/api2` - A simpler Express API with SQLite

Same endpoints, same functionality, different storage layer. This wasn't about replacing the original—it was about exploring alternatives, comparing approaches, finding the right foundation for real-time collaboration.

```javascript
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/files', filesRouter);
```

## The Philosophical Shift

This session revealed something important about building prototypes: **Sometimes you need to build it twice to build it right.**

The first API (Next.js + files) taught us the domain model. The second API (Express + SQLite) would teach us about persistence. Neither was wrong. Both were necessary steps toward understanding what we actually needed.

The cr-sqlite dream was still there in the plan, but we were taking a step back. Before we could build real-time collaboration with CRDTs, we needed to understand our data layer. SQLite first, then cr-sqlite. Walking before running.

## The Unfinished Business

The session ended with api2 partially built—the server was there, the package.json updated, but the database schema and routes were still to come. We had:

- An Express server ready to run on port 3003
- Better-sqlite3 as our database engine
- The same validation with Zod
- The same logger we'd just built

But no actual database implementation yet. No routes. No schema.

It was Friday night. The foundation was being laid, but the real work—making documents actually collaborative—was still ahead.

## The Pattern of Progress

Looking back, a pattern was emerging in how this project evolved:

1. **Dream big**: Real-time collaboration with CRDTs
2. **Plan thoroughly**: Three-week implementation plan
3. **Simplify ruthlessly**: "We're prototyping"
4. **Build incrementally**: Express + SQLite first
5. **Learn by doing**: Two APIs teaching different lessons

Each session built on the last, but not always in the direction you'd expect. Sometimes progress meant building sideways—creating alternatives, exploring options, learning what worked.

The collaborative editing dream was still alive. But first, we needed to get SQLite working.

*To be continued...*

---

*Next: Three hours later, still Friday night—"Let's do step 1 of this plan." The deployment to Fly.io, the UPDATE endpoint, and why the cr-sqlite dream would hit its first roadblock.*