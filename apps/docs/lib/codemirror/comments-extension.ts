import { 
  Decoration,
  DecorationSet,
  EditorView
} from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder, Transaction } from '@codemirror/state';
import { Comment } from '../types/comment';

// Effect to update comments
export const setCommentsEffect = StateEffect.define<Comment[]>();

// Decoration mark for commented text
const commentMark = Decoration.mark({
  class: 'cm-comment-highlight',
  attributes: { title: 'Click to view comment' }
});

// State field to track comments and their decorations
export const commentsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  
  update(decorations: DecorationSet, tr: Transaction) {
    // Check for comments update effect
    for (const effect of tr.effects) {
      if (effect.is(setCommentsEffect)) {
        const builder = new RangeSetBuilder<Decoration>();
        
        // Sort comments by start position to build decorations properly
        const sortedComments = [...effect.value].sort((a, b) => {
          const aStart = a.resolvedStart ?? a.anchorStart;
          const bStart = b.resolvedStart ?? b.anchorStart;
          return aStart - bStart;
        });
        
        for (const comment of sortedComments) {
          // Skip orphaned comments
          if (comment.status === 'orphaned') {
            continue;
          }
          
          // Use resolved positions if available, otherwise fall back to original positions
          const start = comment.resolvedStart ?? comment.anchorStart;
          const end = comment.resolvedEnd ?? comment.anchorEnd;
          
          // Ensure positions are within document bounds
          const boundedStart = Math.max(0, Math.min(start, tr.newDoc.length));
          const boundedEnd = Math.max(boundedStart, Math.min(end, tr.newDoc.length));
          
          if (boundedStart < boundedEnd) {
            builder.add(boundedStart, boundedEnd, commentMark);
          }
        }
        
        return builder.finish();
      }
    }
    
    // Map decorations through document changes
    return decorations.map(tr.changes);
  },
  
  provide: (field: StateField<DecorationSet>) => EditorView.decorations.from(field)
});

// Theme for comment highlights
export const commentTheme = EditorView.theme({
  '.cm-comment-highlight': {
    backgroundColor: '#ffeb3b4d',
    borderBottom: '2px solid #fbc02d',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#ffeb3b66'
    }
  }
});

// Helper to update comments in the editor
export function updateComments(view: EditorView, comments: Comment[]) {
  view.dispatch({
    effects: setCommentsEffect.of(comments)
  });
}