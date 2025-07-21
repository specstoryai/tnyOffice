'use client';

import { useState, useEffect, useCallback } from 'react';
import { log } from '@tnyoffice/logger';
import { GitBranch } from 'lucide-react';
import { GitSyncModal } from './GitSyncModal';
import { syncToGit } from '../lib/git-sync';
import { apiGet } from '../lib/api/client';

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


export function DocumentList({ selectedId, onSelect, onCreateNew, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showGitSync, setShowGitSync] = useState(false);
  const limit = 20;

  const fetchDocuments = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const currentOffset = reset ? 0 : offset;
      
      const endpoint = `/api/v1/files?limit=${limit}&offset=${currentOffset}`;
      log.debug('Fetching documents from:', endpoint);
      
      const data = await apiGet<{ files: FileMetadata[]; total: number }>(endpoint);
      log.info('Documents fetched:', data);
      
      if (reset) {
        setDocuments(data.files);
      } else {
        setDocuments(prev => [...prev, ...data.files]);
      }
      
      setHasMore(data.files.length === limit && currentOffset + limit < data.total);
      if (!reset) setOffset(currentOffset + limit);
    } catch (err) {
      log.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [offset, limit]);

  useEffect(() => {
    fetchDocuments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocuments(true);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleGitSync = async (remoteUrl?: string, commitMessage?: string) => {
    const result = await syncToGit(remoteUrl, commitMessage);
    
    if (!result.success) {
      throw new Error(result.error || 'Sync failed');
    }
    
    log.info('Git sync successful:', result);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={onCreateNew}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          New Document
        </button>
        <button
          onClick={() => setShowGitSync(true)}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <GitBranch size={18} />
          Sync to Git
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

      {/* Git Sync Modal */}
      <GitSyncModal
        isOpen={showGitSync}
        onClose={() => setShowGitSync(false)}
        onSync={handleGitSync}
      />
    </div>
  );
}