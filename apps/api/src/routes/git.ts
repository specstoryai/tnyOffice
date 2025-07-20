import { Router, Request, Response } from 'express';
import { getGitSyncService } from '../services/git-sync.js';
import { log } from '../utils/logger.js';

const router = Router();

// POST /api/v1/git/sync - Sync all documents to git repository
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    log.info('Starting git sync');
    log.info('Environment check:', {
      hasRemoteUrl: !!process.env.GIT_REMOTE_URL,
      remoteUrl: process.env.GIT_REMOTE_URL ? process.env.GIT_REMOTE_URL.replace(/:[^@]+@/, ':***@') : 'not set'
    });
    
    const gitSyncService = getGitSyncService();
    const result = await gitSyncService.syncDocuments();
    
    log.info('Git sync result:', {
      success: result.success,
      commitHash: result.commitHash,
      pushedToRemote: result.pushedToRemote,
      remoteUrl: result.remoteUrl,
      changes: {
        added: result.changes.added.length,
        modified: result.changes.modified.length,
        deleted: result.changes.deleted.length
      }
    });
    
    if (result.success) {
      res.json(result);
    } else {
      log.error('Git sync failed:', result.error);
      res.status(500).json({
        error: result.error || 'Git sync failed',
        ...result
      });
    }
  } catch (error) {
    log.error('Git sync endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error during git sync',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;