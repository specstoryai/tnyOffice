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
        const sortedComments = [...effect.value].sort((a, b) => a.anchorStart - b.anchorStart);
        
        for (const comment of sortedComments) {
          // Ensure positions are within document bounds
          const start = Math.max(0, Math.min(comment.anchorStart, tr.newDoc.length));
          const end = Math.max(start, Math.min(comment.anchorEnd, tr.newDoc.length));
          
          if (start < end) {
            builder.add(start, end, commentMark);
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