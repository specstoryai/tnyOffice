'use client';

import { useState, useEffect } from 'react';
import { Editor } from './Editor';
import { CollaborativeEditor } from './ClientOnlyCollaborativeEditor';
import type { AutomergeUrlResponse } from '@/lib/automerge/types';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [automergeUrl, setAutomergeUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useCollaborative, setUseCollaborative] = useState(false);

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
        setEditedContent(data.content);
        setIsEditing(false);
        
        // Fetch Automerge URL for collaborative editing
        try {
          const automergeResponse = await fetch(`${API_BASE}/api/v1/files/${documentId}/automerge`);
          if (automergeResponse.ok) {
            const { automergeUrl } = await automergeResponse.json() as AutomergeUrlResponse;
            setAutomergeUrl(automergeUrl);
          }
        } catch (err) {
          console.warn('Failed to get Automerge URL:', err);
        }
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

  const handleSave = async () => {
    if (!document || !documentId) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/v1/files/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const updatedData = await response.json();
      setDocument(updatedData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(document?.content || '');
    setIsEditing(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {document.filename}
            </h1>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDate(document.updatedAt)} • {formatSize(document.size)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {useCollaborative && (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            )}
            {!isEditing && !useCollaborative ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Edit
                </button>
                {automergeUrl && (
                  <button
                    onClick={() => setUseCollaborative(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                  >
                    Collaborate
                  </button>
                )}
              </>
            ) : useCollaborative ? (
              <button
                onClick={() => setUseCollaborative(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Exit Collaborative Mode
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {useCollaborative && automergeUrl ? (
          <CollaborativeEditor
            documentUrl={automergeUrl}
            readOnly={false}
            onConnectionChange={setIsConnected}
            placeholder="Start typing..."
          />
        ) : (
          <Editor 
            value={isEditing ? editedContent : document.content} 
            onChange={isEditing ? setEditedContent : undefined}
            readOnly={!isEditing} 
          />
        )}
      </div>

      {/* Error message */}
      {error && isEditing && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}