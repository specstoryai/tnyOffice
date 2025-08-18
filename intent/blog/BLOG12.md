# Building TnyOffice: The Hard Problems

## Part 12: Git Pull and Undo/Redo - When Simple Gets Complex

*July 20, 2025, 12:24 PM EDT*

After implementing comments, two architectural questions emerged that would test the foundations of TnyOffice: "let's start thinking about how we'll handle pulling changes from git" and later, "we need to make our own plan for undo/redo."

These weren't features—they were fundamental challenges to the collaborative editing model.

## The Git Pull Conundrum

The question was deceptively simple: What happens when someone edits a document in git while others are editing it live in the app?

"help me understand in detail how the diffs from git will get applied. will they completely overwrite docs or just look like changes. what if people are editing the doc in realtime then what?"

This revealed the core tension: Git thinks in files. Automerge thinks in operations. Users think in edits.

### The Naive Approach Would Fail

```typescript
handle.change((doc) => {
  doc.content = gitContent; // BAD: Replaces entire document
});
```

"User A would experience: Entire document instantly replaced, cursor position jumps to beginning, text being typed is lost... Terrible user experience!"

### The Sophisticated Solution

The plan that emerged treated git changes as collaborative edits:

1. **Calculate differences** using diff algorithms
2. **Convert to character operations** 
3. **Apply as Automerge operations**
4. **Let CRDT handle conflicts**

The result: "Changes appear gradually, like another user typing. Cursor position preserved when possible. Can continue typing without interruption."

Git changes wouldn't disrupt—they'd collaborate.

## The Undo/Redo Architecture

"read this readme carefully https://github.com/onsetsoftware/automerge-repo-undo-redo ... I don't want to use this github repo because it's not active. I want to learn from it and you read its code and you make our own plan for this."

Claude analyzed the reference implementation and created something better—an undo/redo system that understood collaboration.

### Key Insights

1. **User-Specific History**: Each user has their own undo stack for their changes only
2. **Patch-Based Storage**: Use Automerge's native patch system
3. **Scope Support**: Separate undo for text vs comments
4. **Transaction Support**: Group related changes

The architecture:
```typescript
interface UndoRedoEntry {
  patches: {
    redo: Patch[];  // To apply the change
    undo: Patch[];  // To reverse the change
  };
  heads: {
    before: Heads;  // Document state before
    after: Heads;   // Document state after
  };
}
```

## The Comment Synchronization Challenge

"capture the fact that we'll also need to do work so that undo/redo works nicely with comments so that when the user makes an undo or redo that modifies the text that a comment was associated with the right thing happens."

This was the hardest problem yet. Comments are anchored to text positions. What happens when undo changes those positions?

### The Edge Cases

1. **Text Deletion Undo**: Comments should reappear at original positions
2. **Text Insertion Undo**: Comments should shrink back to original boundaries
3. **Comment Orphaning**: When commented text disappears completely
4. **Position Reversal**: When operations flip start and end positions

The solution involved cursor tracking, position validation, and careful state management:

```typescript
function validateCommentPositions(doc: MarkdownDocument) {
  Object.entries(doc.comments || {}).forEach(([id, comment]) => {
    const startPos = getCursorPosition(comment.startCursor);
    const endPos = getCursorPosition(comment.endCursor);
    
    if (startPos === endPos) {
      comment.status = 'orphaned';
    } else if (startPos > endPos) {
      // Swap if reversed
      [comment.anchorStart, comment.anchorEnd] = [endPos, startPos];
    }
  });
}
```

## The Pattern of Complexity

Saturday afternoon revealed a pattern in TnyOffice's evolution:

1. **Start with simple features** (comments, git sync)
2. **Discover edge cases** (live editing conflicts, position tracking)
3. **Design sophisticated solutions** (diff-based merge, cursor tracking)
4. **Maintain simple UX** (looks like normal editing)

Each "simple" feature revealed layers of complexity that required deep architectural thinking.

## The Philosophy Emerges

These planning sessions crystallized TnyOffice's philosophy:

**External changes should feel like collaboration, not disruption.**

Whether from git, undo/redo, or other users:
- Changes apply gradually
- Positions adjust naturally  
- Conflicts resolve automatically
- Users keep working uninterrupted

## The Documents Created

Two comprehensive planning documents emerged:

1. **`git_pull_plan.md`**: 979 lines detailing diff-based merge strategy
2. **`undo_redo_plan.md`**: 378 lines (before comment sync additions)

These weren't just feature specs—they were architectural treatises on collaborative editing.

## The Realization

By noon on Saturday, TnyOffice had evolved from a "GDocs for markdown" prototype to a system grappling with fundamental problems in collaborative software:

- How do you merge external changes without disruption?
- How do you undo in a collaborative environment?
- How do you maintain referential integrity across operations?

The answers weren't in libraries or frameworks. They required understanding the deep structure of collaborative editing and designing solutions from first principles.

*To be continued...*

---

*Next: From planning to implementation. The weekend winds down, but the ideas keep flowing.*