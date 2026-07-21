import express from 'express';
import {
  handleRepoDetect,
  handleRepoStatus,
  handleRepoDiff,
  handleSuggestCommit,
  handleCommitPush,
  handlePush,
  handlePull,
  handleSync,
  handleResolveConflicts,
  handleAutoPushStats,
  handleAutoPushHistory
} from '../controllers/gitController.js';

const router = express.Router();

/**
 * Repository Detection and Status
 */
router.post('/detect', handleRepoDetect);
router.post('/status', handleRepoStatus);
router.post('/diff', handleRepoDiff);

/**
 * Commit and Push Operations
 */
router.post('/commit-push', handleCommitPush);
router.post('/push', handlePush);
router.post('/pull', handlePull);
router.post('/sync', handleSync);

/**
 * Conflict Resolution
 */
router.post('/resolve-conflicts', handleResolveConflicts);

/**
 * Auto-Push Scheduler
 */
router.get('/auto-push/stats', handleAutoPushStats);
router.post('/auto-push/history', handleAutoPushHistory);

export default router;
