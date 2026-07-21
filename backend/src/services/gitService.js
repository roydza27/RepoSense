import { promises as fs } from 'fs';
import path from 'path';
import {
  executeGit,
  parseDiffStats,
  generateCommitSuggestion
} from '../utils/gitHelper.js';
import {
  saveCommit,
  updateCommitPushStatus,
  saveGitAnalyticsEvent,
  getAutoPushHistory,
  getAutoPushStats
} from '../models/gitModel.js';

/**
 * Get repository status
 * @param {string} workspacePath - Repository path
 * @returns {Promise<Object>}
 */
export async function getRepoStatus(workspacePath) {
  try {
    const statusResult = await executeGit('git status --porcelain', workspacePath);

    if (!statusResult.success) {
      throw new Error(statusResult.error);
    }

    const files = statusResult.output
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const status = line.substring(0, 2);
        const filepath = line.substring(3);
        return { status, filepath };
      });

    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get repository diff stats
 * @param {string} workspacePath - Repository path
 * @returns {Promise<Object>}
 */
export async function getRepoDiff(workspacePath) {
  try {
    const diffResult = await executeGit('git diff --shortstat', workspacePath);

    if (!diffResult.success) {
      throw new Error(diffResult.error);
    }

    const stats = parseDiffStats(diffResult.output);

    return {
      success: true,
      ...stats,
      summary: diffResult.output || 'No changes'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get AI-generated commit suggestion
 * @param {string} workspacePath - Repository path
 * @returns {Promise<Object>}
 */
export async function getSuggestCommit(workspacePath) {
  try {
    const statusResult = await executeGit('git status --porcelain', workspacePath);

    if (!statusResult.success) {
      return { success: true, suggestion: 'Update files' };
    }

    const suggestion = generateCommitSuggestion(statusResult.output);
    return { success: true, suggestion };
  } catch (error) {
    return { success: true, suggestion: 'Update files' };
  }
}

/**
 * Commit and optionally push changes
 * @param {Object} params - { workspacePath, message, autoPush, forcePush }
 * @returns {Promise<Object>}
 */
export async function commitAndPush(params) {
  const { workspacePath, message, autoPush = false, forcePush = false } = params;

  try {
    // Stage changes
    const addResult = await executeGit('git add .', workspacePath);
    if (!addResult.success) {
      throw new Error(`Failed to stage files: ${addResult.error}`);
    }

    // Check if changes exist
    const statusResult = await executeGit('git status --porcelain', workspacePath);
    const hasChanges = statusResult.output.trim().length > 0;

    let committed = false;
    let commitHash = null;
    let filesChanged = 0,
      linesAdded = 0,
      linesRemoved = 0;
    let pullNeeded = false;

    // Commit if changes exist
    if (hasChanges) {
      const diffResult = await executeGit('git diff --cached --shortstat', workspacePath);
      const stats = parseDiffStats(diffResult.output);
      filesChanged = stats.filesChanged;
      linesAdded = stats.linesAdded;
      linesRemoved = stats.linesRemoved;

      const commitResult = await executeGit(`git commit -m "${message}"`, workspacePath);
      if (!commitResult.success) {
        throw new Error(`Commit failed: ${commitResult.error}`);
      }

      committed = true;

      const hashResult = await executeGit('git rev-parse HEAD', workspacePath);
      commitHash = hashResult.success ? hashResult.output.trim() : null;

      // Save commit to database
      if (commitHash) {
        saveCommit({
          repo_path: workspacePath,
          commit_hash: commitHash,
          commit_message: message,
          files_count: filesChanged,
          push_success: 0
        });
      }
    }

    // Check if repo is ahead
    const aheadCheck = await executeGit('git status -sb', workspacePath);
    const isAhead = aheadCheck.output.includes('[ahead');

    let pushed = false;

    // Push if autoPush enabled and repo is ahead
    if (autoPush && isAhead) {
      const branchResult = await executeGit('git rev-parse --abbrev-ref HEAD', workspacePath);
      const branch = branchResult.success ? branchResult.output.trim() : 'main';

      const pushCommand = forcePush
        ? `git push origin ${branch} --force`
        : `git push origin ${branch}`;

      const pushResult = await executeGit(pushCommand, workspacePath);

      if (!pushResult.success) {
        if (
          pushResult.error.includes('rejected') ||
          pushResult.error.includes('non-fast-forward')
        ) {
          pullNeeded = true;
        }
      } else {
        pushed = true;
        // Update commit push success
        if (commitHash) {
          updateCommitPushStatus(commitHash, true);
        }
      }
    }

    // Log analytics
    if (committed) {
      saveGitAnalyticsEvent({
        repo_path: workspacePath,
        action: 'commit_push',
        files_changed: filesChanged,
        lines_added: linesAdded,
        lines_removed: linesRemoved,
        success: pushed || (!autoPush && committed)
      });
    }

    return {
      success: true,
      committed,
      pushed,
      repoAhead: isAhead,
      commitHash,
      filesChanged,
      linesAdded,
      linesRemoved,
      pullNeeded,
      forcePushed: forcePush && pushed,
      message:
        !hasChanges && !isAhead ? 'Repo clean and already synced.' : undefined
    };
  } catch (error) {
    console.error('Commit-Push Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Push to remote
 * @param {string} workspacePath - Repository path
 * @param {boolean} forcePush - Force push flag
 * @returns {Promise<Object>}
 */
export async function pushToRemote(workspacePath, forcePush = false) {
  try {
    const branchResult = await executeGit('git rev-parse --abbrev-ref HEAD', workspacePath);
    const currentBranch = branchResult.success ? branchResult.output : 'main';

    const pushCommand = forcePush
      ? `git push origin ${currentBranch} --force`
      : `git push origin ${currentBranch}`;

    const pushResult = await executeGit(pushCommand, workspacePath);

    if (!pushResult.success) {
      const needsPull = pushResult.error.includes('rejected') || pushResult.error.includes('non-fast-forward');
      return {
        success: false,
        error: pushResult.error,
        needsPull
      };
    }

    return {
      success: true,
      message: forcePush ? 'Force pushed successfully' : 'Pushed successfully',
      forcePushed: forcePush
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Pull from remote
 * @param {string} workspacePath - Repository path
 * @param {boolean} rebase - Use rebase instead of merge
 * @returns {Promise<Object>}
 */
export async function pullFromRemote(workspacePath, rebase = false) {
  try {
    const branchResult = await executeGit('git rev-parse --abbrev-ref HEAD', workspacePath);
    const currentBranch = branchResult.success ? branchResult.output : 'main';

    const pullCommand = rebase
      ? `git pull origin ${currentBranch} --rebase`
      : `git pull origin ${currentBranch}`;

    const pullResult = await executeGit(pullCommand, workspacePath);

    if (!pullResult.success) {
      return {
        success: false,
        error: pullResult.error,
        hasConflicts: pullResult.error.includes('conflict')
      };
    }

    return {
      success: true,
      message: 'Pulled successfully',
      output: pullResult.output
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync repository (pull then push)
 * @param {string} workspacePath - Repository path
 * @param {boolean} forcePush - Force push after pull
 * @returns {Promise<Object>}
 */
export async function syncRepository(workspacePath, forcePush = false) {
  try {
    const branchResult = await executeGit('git rev-parse --abbrev-ref HEAD', workspacePath);
    const currentBranch = branchResult.success ? branchResult.output : 'main';

    // First, pull
    const pullResult = await executeGit(`git pull origin ${currentBranch}`, workspacePath);

    if (!pullResult.success) {
      if (pullResult.error.includes('conflict') || pullResult.error.includes('CONFLICT')) {
        return {
          success: false,
          error: 'Merge conflicts detected. Please resolve manually.',
          hasConflicts: true
        };
      }
    }

    // Then push
    const pushCommand = forcePush
      ? `git push origin ${currentBranch} --force`
      : `git push origin ${currentBranch}`;

    const pushResult = await executeGit(pushCommand, workspacePath);

    return {
      success: pushResult.success,
      pulled: pullResult.success,
      pushed: pushResult.success,
      error: pushResult.success ? null : pushResult.error
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Resolve merge conflicts
 * @param {string} workspacePath - Repository path
 * @param {string} strategy - 'ours' or 'theirs'
 * @returns {Promise<Object>}
 */
export async function resolveConflicts(workspacePath, strategy) {
  try {
    if (strategy !== 'ours' && strategy !== 'theirs') {
      return { success: false, error: 'Invalid strategy. Use "ours" or "theirs"' };
    }

    let resolveCommand;
    if (strategy === 'ours') {
      resolveCommand = 'git checkout --ours . && git add .';
    } else {
      resolveCommand = 'git checkout --theirs . && git add .';
    }

    const resolveResult = await executeGit(resolveCommand, workspacePath);

    if (!resolveResult.success) {
      return { success: false, error: resolveResult.error };
    }

    return {
      success: true,
      message: `Conflicts resolved using ${strategy} version`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default {
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
};

/**
 * Detect if workspace is a Git repository
 * @param {string} workspacePath - Repository path
 * @returns {Promise<Object>}
 */
export async function detectRepo(workspacePath) {
  try {
    const gitPath = path.join(workspacePath, '.git');
    
    try {
      await fs.access(gitPath);
    } catch {
      return { isRepo: false, message: 'No .git directory found' };
    }

    const repoName = path.basename(workspacePath);

    const branchResult = await executeGit('git rev-parse --abbrev-ref HEAD', workspacePath);
    const currentBranch = branchResult.success ? branchResult.output : 'main';

    const remoteResult = await executeGit('git remote get-url origin', workspacePath);
    const remoteUrl = remoteResult.success ? remoteResult.output : 'Not configured';

    const branchesResult = await executeGit('git branch', workspacePath);
    const branches = branchesResult.success
      ? branchesResult.output.split('\n').map(b => b.trim().replace('* ', ''))
      : [];

    return {
      isRepo: true,
      repoName,
      currentBranch,
      remoteUrl,
      branches
    };
  } catch (error) {
    return { isRepo: false, error: error.message };
  }
}

/**
 * Get auto-push job history
 * @param {string} workspacePath - Repository path
 * @param {number} limit - Max records to return
 * @returns {Object}
 */
export function getAutoPushHistoryData(workspacePath, limit = 20) {
  try {
    const jobs = getAutoPushHistory(workspacePath, limit);
    return {
      success: true,
      jobs,
      count: jobs.length
    };
  } catch (error) {
    return {
      success: false,
      jobs: [],
      count: 0,
      error: error.message
    };
  }
}

/**
 * Get auto-push statistics
 * @returns {Object}
 */
export function getAutoPushStatsData() {
  try {
    const stats = getAutoPushStats();
    return {
      success: true,
      ...stats,
      active: 0,
      scheduled: 0
    };
  } catch (error) {
    return {
      success: false,
      total: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      active: 0,
      scheduled: 0,
      error: error.message
    };
  }
}

