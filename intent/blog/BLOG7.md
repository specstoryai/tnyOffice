# Building TnyOffice: Down the WASM Rabbit Hole

## Part 7: Understanding the Magic Under the Hood

*July 20, 2025, 6:50 AM EDT*

Twenty-two minutes after creating the comprehensive Automerge plan, I needed to understand something deeper: "read what you can online about the automerge crdt project then help me understand where its using wasm in a scenario like a nextjs app as the frontend and a plain node api backend"

This wasn't about implementation anymore. This was about understanding the architecture—why a collaboration library written in Rust was running in JavaScript.

## The Revelation

Claude's research uncovered the elegant architecture:

**Automerge's core CRDT logic is written in Rust and compiled to WebAssembly.**

This single design decision cascaded into everything:
- High performance for conflict resolution algorithms
- Cross-platform compatibility (browser, Node.js, mobile)
- Memory safety from Rust
- Consistent behavior everywhere

## The Package Puzzle

The investigation revealed a layered architecture:

```
@automerge/automerge         (High-level JavaScript API)
    ↓
@automerge/automerge-wasm    (Low-level WASM bindings)
    ↓
Rust core compiled to WASM   (The actual CRDT magic)
```

But here was the catch: "@automerge/automerge-wasm is something we currently consider to be an implementation detail and should not be depended on by third parties."

The WASM layer was meant to be invisible—power without complexity.

## The Frontend Challenge

For Next.js, things got interesting:

```javascript
// Can't just import and use
import { next as Automerge } from '@automerge/automerge/slim'
import wasm from "@automerge/automerge/automerge.wasm?url"

// Must initialize WASM first
await Automerge.initializeWasm(wasm)
```

Browsers don't support WebAssembly modules in ESM imports. You need bundler magic. Webpack needs `asyncWebAssembly` experiments. The complexity was leaking through.

## The Backend Simplicity

But in Node.js? Different story:

```javascript
// Just works
import { next as Automerge } from '@automerge/automerge'
const doc = Automerge.init()
```

No initialization. No configuration. The WASM loads transparently. Node.js treated WebAssembly like any other module.

## The Performance Numbers

Claude found Martin Kleppmann's columnar encoding achievements:
- 100KB document stored in 160KB on disk
- Only 1.5-2x size overhead
- Near-native speed for complex algorithms

This wasn't theoretical. Real documents, real performance, real memory efficiency.

## The Packaging Evolution

August 2024 had brought new packaging options:

1. **Standard Import** (for modern bundlers)
2. **Base64 Fallback** (for challenging environments)
3. **Manual initialization** (for control freaks)

The goal: "make Automerge possible anywhere, including quite a few places where it was difficult or impossible before."

They'd solved for:
- Cloudflare Workers
- React Native
- Val.town
- Various bundlers

## The Architectural Wisdom

What emerged from this research session was profound:

**WASM wasn't just an implementation detail—it was the architecture.**

By writing the core in Rust and compiling to WASM, Automerge achieved:
- **Write once, run everywhere** (but actually)
- **Performance** where it mattered (the algorithms)
- **Flexibility** where needed (the JavaScript API)
- **Safety** throughout (Rust's guarantees)

## The Implication for TnyOffice

This research session changed how I thought about the implementation:

1. **Frontend complexity was expected**—bundler configuration was the price for WASM performance
2. **Backend simplicity was a gift**—Node.js would handle everything transparently
3. **The same code everywhere**—no separate implementations for client and server
4. **Performance was built-in**—not something to optimize later

## The Pattern Recognition

Saturday morning, still before 7 AM. The pattern of the project was becoming clear:

- **Friday evening**: Dream and plan
- **Friday night**: Build and hit walls
- **Saturday morning**: Research and understand

Each session wasn't just about writing code. It was about understanding the problem space, the tools, the tradeoffs. The WebAssembly research wasn't a detour—it was essential preparation.

Because when you're building real-time collaboration, you need to understand not just what works, but why it works. The WASM layer wasn't complexity—it was the foundation that made everything else simple.

*To be continued...*

---

*Next: With the architecture understood, it's time to implement. But first, a surprise pivot: "Actually, let's try something completely different..."*