import express from 'express';
import {
  getReports,
  getReportsSummary,
  getRemoteSwitches,
  logAnalyticEvent,
  logNewCommit,
  getAnalytics,
  getLogs
} from '../controllers/reportController.js';

const router = express.Router();

/**
 * Reports API Routes
 */

// GET endpoints
router.get('/', getReports);
router.get('/summary', getReportsSummary);
router.get('/remote-switches', getRemoteSwitches);

// POST endpoints
router.post('/analytics', logAnalyticEvent);
router.post('/commits', logNewCommit);

export default router;
