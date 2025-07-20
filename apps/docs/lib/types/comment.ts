export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  anchorStart: number;
  anchorEnd: number;
}

export interface CreateCommentInput {
  author: string;
  text: string;
  anchorStart: number;
  anchorEnd: number;
}