'use client';

import React from 'react';
import { Comment } from '@/lib/types/comment';
import { Trash2 } from 'lucide-react';
import { deleteComment } from '@/lib/api/comments';

interface CommentsSidebarProps {
  fileId: string;
  comments: Comment[];
  onCommentClick: (comment: Comment) => void;
  onCommentsUpdate: () => void;
  currentUser?: string;
}

export function CommentsSidebar({ 
  fileId,
  comments, 
  onCommentClick, 
  onCommentsUpdate,
  currentUser = 'Anonymous'
}: CommentsSidebarProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);
      await deleteComment(fileId, commentId);
      onCommentsUpdate();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (comments.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No comments yet. Select text and press Cmd+K to add a comment.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-4 hover:bg-gray-50 cursor-pointer group"
          onClick={() => onCommentClick(comment)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className="text-gray-500 text-xs">{formatTime(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700">{comment.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                Characters {comment.anchorStart}-{comment.anchorEnd}
              </p>
            </div>
            {comment.author === currentUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(comment.id);
                }}
                disabled={deletingId === comment.id}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                title="Delete comment"
              >
                <Trash2 className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}