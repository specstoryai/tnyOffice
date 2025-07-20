import { DocumentId } from '@automerge/automerge-repo';

// Define the structure of our Automerge document
export interface MarkdownDocument {
  content: string;
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