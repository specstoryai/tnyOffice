'use client';

import { useState, useEffect } from 'react';

interface FileMetadata {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
}

interface DocumentListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  refreshTrigger?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
console.log('DocumentList - API_BASE:', API_BASE);

export function DocumentList({ selectedId, onSelect, onCreateNew, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const fetchDocuments = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentOffset = reset ? 0 : offset;
      
      const url = `${API_BASE}/api/v1/files?limit=${limit}&offset=${currentOffset}`;
      console.log('Fetching documents from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Documents fetched:', data);
      
      if (reset) {
        setDocuments(data.files);
      } else {
        setDocuments(prev => [...prev, ...data.files]);
      }
      
      setHasMore(data.files.length === limit && currentOffset + limit < data.total);
      if (!reset) setOffset(currentOffset + limit);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocuments(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCreateNew}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Document
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto">
        {loading && documents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">{error}</div>
        ) : documents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No documents yet</div>
        ) : (
          <>
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedId === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {doc.filename}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(doc.createdAt)} • {formatSize(doc.size)}
                </div>
              </button>
            ))}
            
            {hasMore && (
              <button
                onClick={() => fetchDocuments(false)}
                disabled={loading}
                className="w-full p-4 text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}