import { getDatabase } from '../database/connection.js';

/**
 * Save commit record to database
 * @param {Object} commitData - Commit data
 * @returns {Object} Inserted record
 */
export function saveCommit(commitData) {
  try {
    const db = getDatabase();
    const {
      repo_path,
      commit_hash,
      commit_message,
      files_count,
      push_success
    } = commitData;

    const query = `
      INSERT INTO commits 
      (repo_path, commit_hash, commit_message, timestamp, files_count, push_success)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(query).run(
      repo_path,
      commit_hash,
      commit_message,
      new Date().toISOString(),
      files_count || 0,
      push_success ? 1 : 0
    );

    return { id: result.lastInsertRowid, ...commitData, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  }
}

/**
 * Update commit push success status
 * @param {string} commitHash - Commit hash
 * @param {boolean} success - Push success status
 */
export function updateCommitPushStatus(commitHash, success) {
  try {
    const db = getDatabase();
    const query = 'UPDATE commits SET push_success = ? WHERE commit_hash = ?';
    db.prepare(query).run(success ? 1 : 0, commitHash);
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

/**
 * Get total commits count
 * @returns {number}
 */
export function getTotalCommitsCount() {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM commits').get();
    return result?.count || 0;
  } catch (error) {
    console.error('Database error:', error.message);
    return 0;
  }
}

/**
 * Get successful pushes count
 * @returns {number}
 */
export function getSuccessfulPushesCount() {
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM commits WHERE push_success = 1').get();
    return result?.count || 0;
  } catch (error) {
    console.error('Database error:', error.message);
    return 0;
  }
}

/**
 * Schedule auto-push job
 * @param {Object} jobData - Job data
 * @returns {string} Job ID
 */
export function scheduleAutoPushJob(jobData) {
  try {
    const db = getDatabase();
    const jobId = `autopush_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { repo_path, scheduled_at, execute_at } = jobData;

    const query = `
      INSERT INTO auto_push_jobs (repo_path, scheduled_at, execute_at, status, job_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.prepare(query).run(repo_path, scheduled_at, execute_at, 'scheduled', jobId);
    return jobId;
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  }
}

/**
 * Update auto-push job status
 * @param {string} jobId - Job ID
 * @param {string} status - New status (running, completed, failed, cancelled)
 * @param {string} errorMessage - Optional error message
 */
export function updateAutoPushJobStatus(jobId, status, errorMessage = null) {
  try {
    const db = getDatabase();
    const query = `
      UPDATE auto_push_jobs 
      SET status = ?, completed_at = ?, error = ?
      WHERE job_id = ?
    `;

    db.prepare(query).run(status, new Date().toISOString(), errorMessage, jobId);
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

/**
 * Get auto-push job by ID
 * @param {string} jobId - Job ID
 * @returns {Object|null} Job record
 */
export function getAutoPushJob(jobId) {
  try {
    const db = getDatabase();
    const query = 'SELECT * FROM auto_push_jobs WHERE job_id = ?';
    return db.prepare(query).get(jobId);
  } catch (error) {
    console.error('Database error:', error.message);
    return null;
  }
}

/**
 * Get auto-push job history for a repo
 * @param {string} repoPath - Repository path
 * @param {number} limit - Max records
 * @returns {Array}
 */
export function getAutoPushHistory(repoPath, limit = 20) {
  try {
    const db = getDatabase();
    const query = `
      SELECT * FROM auto_push_jobs 
      WHERE repo_path = ?
      ORDER BY scheduled_at DESC 
      LIMIT ?
    `;
    return db.prepare(query).all(repoPath, limit);
  } catch (error) {
    console.error('Database error:', error.message);
    return [];
  }
}

/**
 * Get auto-push statistics
 * @returns {Object} Stats summary
 */
export function getAutoPushStats() {
  try {
    const db = getDatabase();
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM auto_push_jobs
    `).get();

    return {
      total: stats?.total || 0,
      completed: stats?.completed || 0,
      failed: stats?.failed || 0,
      cancelled: stats?.cancelled || 0
    };
  } catch (error) {
    console.error('Database error:', error.message);
    return { total: 0, completed: 0, failed: 0, cancelled: 0 };
  }
}

/**
 * Save analytics event for Git action
 * @param {Object} analyticsData - Analytics data
 */
export function saveGitAnalyticsEvent(analyticsData) {
  try {
    const db = getDatabase();
    const {
      repo_path,
      action,
      files_changed,
      lines_added,
      lines_removed,
      success,
      error_message
    } = analyticsData;

    const query = `
      INSERT INTO analytics 
      (repo_path, timestamp, action, files_changed, lines_added, lines_removed, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.prepare(query).run(
      repo_path,
      new Date().toISOString(),
      action,
      files_changed || 0,
      lines_added || 0,
      lines_removed || 0,
      success ? 1 : 0,
      error_message || null
    );
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

export default {
  saveCommit,
  updateCommitPushStatus,
  getTotalCommitsCount,
  getSuccessfulPushesCount,
  scheduleAutoPushJob,
  updateAutoPushJobStatus,
  getAutoPushJob,
  getAutoPushHistory,
  getAutoPushStats,
  saveGitAnalyticsEvent
};
