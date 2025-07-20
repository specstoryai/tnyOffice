'use client';

import { useState, useEffect } from 'react';
import { Editor } from './Editor';

interface DocumentViewerProps {
  documentId: string | null;
}

interface FileWithContent {
  id: string;
  filename: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [document, setDocument] = useState<FileWithContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE}/api/v1/files/${documentId}`);
        
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setDocument(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2">Select a document or create a new one</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>
          {error === 'Document not found' && (
            <p className="text-sm text-gray-500">The document may have been deleted or moved.</p>
          )}
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Document header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {document.filename}
        </h1>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatDate(document.updatedAt)} • {formatSize(document.size)}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <Editor value={document.content} readOnly={true} />
      </div>
    </div>
  );
}