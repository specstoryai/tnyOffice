# Building TnyOffice: From "GDocs for Markdown" to Real-Time Collaboration

## Part 1: The Intuition

*July 19, 2025, 6:00 PM EDT*

It started with a simple intuition: "There needs to be something like Google Docs for markdown."

That was the entire pitch I brought to ChatGPT on a Friday evening. Not a technical specification, not a business plan—just a feeling that something was missing in how we create and collaborate on technical documentation.

The response was immediate and energizing. ChatGPT crystallized my vague intuition into a concrete product thesis:

> "A multiplayer Markdown workspace that feels like Google Docs, round-trips like Git, and publishes like a static site generator—without leaving the editor."

## Why This Felt Right

The conversation quickly surfaced why this gap existed:

**Markdown is already universal**—it's the lingua franca for READMEs, specs, documentation, and developer writing. It lives naturally in git repositories. It's future-proof and portable. But despite being everywhere, markdown tools were stuck in single-player mode.

**Collaboration was the missing piece**. Most markdown editors nail the authoring experience or the publishing pipeline, but none delivered Google-grade multiplayer editing—live cursors, comments that stick to content, suggestions and approvals, real-time presence. You either got great solo tools (Obsidian, Typora) or you abandoned markdown entirely for proprietary formats (Notion, Google Docs).

**The doc-as-code movement needed a bridge**. Teams wanted documentation that lived next to their code, version-controlled and diffable. But they also needed non-technical contributors—product managers, designers, stakeholders—to participate without learning git.

## The Technical Challenges

ChatGPT didn't sugarcoat the complexity. Building "GDocs for markdown" meant solving several hard problems:

1. **Track changes on plain text is hard**. Comments and suggestions need to anchor to specific ranges of text. But when text changes, those anchors drift or break. Google Docs solves this with a proprietary format—we'd need to solve it while keeping files as pure `.md`.

2. **Markdown's simplicity fights rich features**. Tables, footnotes, embeds, math equations—they all get awkward in raw markdown. We'd need a rich editing layer that could still round-trip cleanly to plain text.

3. **Real-time collaboration requires CRDTs or Operational Transforms**. The suggestion was clear: use something like Yjs or Automerge for conflict-free collaborative editing. Comments would need to anchor to AST nodes, not character offsets.

4. **The competition was "good enough"**. Many tools did parts of this well. To win, the combination had to be meaningfully better, not just tidier.

## The MVP Vision

What emerged from that first conversation was surprisingly concrete thanks to a bunch of prior chat history I had loaded up:

- **Editor core**: CodeMirror 6 + Yjs/Automerge for real-time collaboration
- **Clean publishing**: Markdown to static HTML with one elegant theme
- **Perfect import/export**: No lock-in, no proprietary markers
- **Comments that survive**: Anchored to AST nodes, not character positions

The traps to avoid were equally clear:
- Don't go MDX-everywhere (kills portability)
- Don't let comments drift (anchor to structure, not position)
- Don't hide proprietary glue in the files (no lock-in in disguise)

## The Cliffhanger

That Friday evening conversation planted a seed. The vision was clear: multiplayer markdown that felt as smooth as Google Docs but as portable as a text file. The technical approach was sketched: CRDTs for collaboration, AST anchoring for comments, clean round-tripping for git compatibility.

But vision and reality are different beasts. The next day, I opened my laptop and started a new session with Claude Code: "This will be a monorepo for a new product called TnyOffice..."

*To be continued...*

---

*Next: How a simple API became a real-time collaboration engine, and why "just add websockets" turned into a two-week journey through Automerge, SQLite adapters, and the surprising complexity of making save buttons disappear.*