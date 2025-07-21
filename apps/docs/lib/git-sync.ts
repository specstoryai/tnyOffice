import { log } from '@tnyoffice/logger';
import { apiPost } from './api/client';

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
    const body: Record<string, string> = {};
    if (remoteUrl) body.remoteUrl = remoteUrl;
    if (commitMessage) body.commitMessage = commitMessage;

    log.info('Syncing to git with:', { remoteUrl: remoteUrl?.replace(/:[^@]+@/, ':***@'), commitMessage });

    return await apiPost('/api/v1/git/sync', Object.keys(body).length > 0 ? body : undefined);
  } catch (error) {
    log.error('Git sync error:', error);
    throw error;
  }
}