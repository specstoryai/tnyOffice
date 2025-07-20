import { log } from '@tnyoffice/logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface GitSyncResult {
  success: boolean;
  commitHash?: string;
  changes: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  pushedToRemote?: boolean;
  remoteUrl?: string;
  error?: string;
}

export async function syncToGit(remoteUrl?: string, commitMessage?: string): Promise<GitSyncResult> {
  try {
    const body: any = {};
    if (remoteUrl) body.remoteUrl = remoteUrl;
    if (commitMessage) body.commitMessage = commitMessage;

    log.info('Syncing to git with:', { remoteUrl: remoteUrl?.replace(/:[^@]+@/, ':***@'), commitMessage });

    const response = await fetch(`${API_BASE}/api/v1/git/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Sync failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    log.error('Git sync error:', error);
    throw error;
  }
}