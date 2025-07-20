import { DocumentId } from '@automerge/automerge-repo';

// Comment structure
export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
  anchorStart: number;  // character offset in document
  anchorEnd: number;    // character offset in document
}

// Define the structure of our Automerge document
export interface MarkdownDocument {
  content: string;
  comments?: { [id: string]: Comment };
  metadata?: {
    filename?: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

// Mapping between our file IDs and Automerge document IDs
export interface FileDocumentMapping {
  fileId: string;
  automergeId: DocumentId;
  filename: string;
}