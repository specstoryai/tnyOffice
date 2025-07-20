import { Comment, CreateCommentInput } from '../types/comment';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createComment(fileId: string, input: CreateCommentInput): Promise<Comment> {
  const response = await fetch(`${API_URL}/api/v1/files/${fileId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create comment: ${response.statusText}`);
  }

  return response.json();
}

export async function getComments(fileId: string): Promise<Comment[]> {
  const response = await fetch(`${API_URL}/api/v1/files/${fileId}/comments`);

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteComment(fileId: string, commentId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/files/${fileId}/comments/${commentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete comment: ${response.statusText}`);
  }
}