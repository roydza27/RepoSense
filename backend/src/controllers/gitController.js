import {
  detectRepo,
  getRepoStatus,
  getRepoDiff,
  getSuggestCommit,
  commitAndPush,
  pushToRemote,
  pullFromRemote,
  syncRepository,
  resolveConflicts,
  getAutoPushHistoryData,
  getAutoPushStatsData
} from '../services/gitService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * POST /api/repo/status - Get repository status
 */
export async function handleRepoStatus(req, res) {
  try {
    const { workspacePath } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = await getRepoStatus(workspacePath);

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/diff - Get repository diff stats
 */
export async function handleRepoDiff(req, res) {
  try {
    const { workspacePath } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = await getRepoDiff(workspacePath);

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/ai/suggest-commit - Get AI commit suggestion
 */
export async function handleSuggestCommit(req, res) {
  try {
    const { workspacePath } = req.body;

    if (!workspacePath) {
      return sendSuccess(res, { suggestion: 'Update files' });
    }

    const result = await getSuggestCommit(workspacePath);

    if (!result.success) {
      return sendSuccess(res, { suggestion: 'Update files' });
    }

    sendSuccess(res, { suggestion: result.suggestion || 'Update files' });
  } catch (error) {
    console.error('Controller error:', error.message);
    sendSuccess(res, { suggestion: 'Update files' });
  }
}

/**
 * POST /api/repo/commit-push - Commit and push changes
 */
export async function handleCommitPush(req, res) {
  try {
    const { workspacePath, message, autoPush = false, forcePush = false } = req.body;

    if (!workspacePath || !message) {
      return sendError(res, 'workspacePath and message are required', 400);
    }

    const result = await commitAndPush({
      workspacePath,
      message,
      autoPush,
      forcePush
    });

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/push - Push to remote
 */
export async function handlePush(req, res) {
  try {
    const { workspacePath, forcePush = false } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = await pushToRemote(workspacePath, forcePush);

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/pull - Pull from remote
 */
export async function handlePull(req, res) {
  try {
    const { workspacePath, rebase = false } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = await pullFromRemote(workspacePath, rebase);

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/sync - Sync repository (pull then push)
 */
export async function handleSync(req, res) {
  try {
    const { workspacePath, forcePush = false } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = await syncRepository(workspacePath, forcePush);

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/detect - Detect if workspace is a Git repository
 */
export async function handleRepoDetect(req, res) {
  try {
    const { workspacePath } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = await detectRepo(workspacePath);

    if (!result.success) {
      return sendError(res, result.error || 'Not a git repository', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * GET /api/repo/auto-push/stats - Get auto-push statistics
 */
export function handleAutoPushStats(req, res) {
  try {
    const result = getAutoPushStatsData();
    if (!result.success) {
      return sendError(res, result.error || 'Failed to fetch stats', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/auto-push/history - Get auto-push job history
 */
export function handleAutoPushHistory(req, res) {
  try {
    const { workspacePath, limit = 20 } = req.body;

    if (!workspacePath) {
      return sendError(res, 'workspacePath is required', 400);
    }

    const result = getAutoPushHistoryData(workspacePath, limit);

    if (!result.success) {
      return sendError(res, result.error || 'Operation failed', 500);
    }

    sendSuccess(res, { jobs: result.jobs || [], count: result.count || 0 });
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

/**
 * POST /api/repo/resolve-conflicts - Resolve merge conflicts
 */
export async function handleResolveConflicts(req, res) {
  try {
    const { workspacePath, strategy } = req.body;

    if (!workspacePath || !strategy) {
      return sendError(res, 'workspacePath and strategy are required', 400);
    }

    const result = await resolveConflicts(workspacePath, strategy);

    if (!result.success) {
      return sendError(res, result.error || 'Repository not found', 400);
    }

    sendSuccess(res, result);
  } catch (error) {
    console.error('Controller error:', error.message);
    sendError(res, error.message, 500);
  }
}

export default {
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
};
