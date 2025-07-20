import { Router, Request, Response } from 'express';
import { getGitSyncService } from '../services/git-sync.js';
import { log } from '../utils/logger.js';

const router = Router();

// POST /api/v1/git/sync - Sync all documents to git repository
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    log.info('Starting git sync');
    
    const gitSyncService = getGitSyncService();
    const result = await gitSyncService.syncDocuments();
    
    if (result.success) {
      res.json(result);
    } else {
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