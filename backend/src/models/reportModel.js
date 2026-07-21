import { getDatabase } from '../database/connection.js';

/**
 * Get count of remote switches
 * @returns {number} Count of remote switch actions
 */
export function getRemoteSwitchCount() {
  try {
    const db = getDatabase();
    const query = "SELECT COUNT(*) as count FROM analytics WHERE action = 'remote_switch'";
    const result = db.prepare(query).get();
    return result.count || 0;
  } catch (error) {
    console.error('Database access error:', error.message);
    return 0;
  }
}

/**
 * Get all analytics records with optional filtering
 * @param {Object} filters - Filter conditions
 * @param {string} filters.action - Filter by action type
 * @param {string} filters.repo_path - Filter by repository path
 * @returns {Array} Array of analytics records
 */
export function getAllAnalytics(filters = {}) {
  try {
    const db = getDatabase();
    let query = 'SELECT * FROM analytics WHERE 1=1';
    const params = {};

    if (filters.action) {
      query += ' AND action = $action';
      params.action = filters.action;
    }
    if (filters.repo_path) {
      query += ' AND repo_path = $repo_path';
      params.repo_path = filters.repo_path;
    }

    query += ' ORDER BY timestamp DESC';
    return db.prepare(query).all(params);
  } catch (error) {
    console.error('Database access error:', error.message);
    return [];
  }
}

/**
 * Log an analytics event
 * @param {Object} data - Analytics data
 * @returns {Object} Inserted record with id
 */
export function logAnalytics(data) {
  try {
    const db = getDatabase();
    const {
      repo_path,
      timestamp,
      action,
      files_changed,
      lines_added,
      lines_removed,
      success,
      error_message
    } = data;

    const query = `
      INSERT INTO analytics 
      (repo_path, timestamp, action, files_changed, lines_added, lines_removed, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(query).run(
      repo_path,
      timestamp,
      action,
      files_changed || 0,
      lines_added || 0,
      lines_removed || 0,
      success ? 1 : 0,
      error_message || null
    );

    return { id: result.lastInsertRowid, ...data };
  } catch (error) {
    console.error('Database insert error:', error.message);
    throw error;
  }
}

/**
 * Get all commits with optional filtering
 * @param {Object} filters - Filter conditions
 * @returns {Array} Array of commit records
 */
export function getAllCommits(filters = {}) {
  try {
    const db = getDatabase();
    let query = 'SELECT * FROM commits WHERE 1=1';
    const params = {};

    if (filters.repo_path) {
      query += ' AND repo_path = $repo_path';
      params.repo_path = filters.repo_path;
    }

    query += ' ORDER BY timestamp DESC';
    return db.prepare(query).all(params);
  } catch (error) {
    console.error('Database access error:', error.message);
    return [];
  }
}

/**
 * Log a commit record
 * @param {Object} data - Commit data
 * @returns {Object} Inserted record with id
 */
export function logCommit(data) {
  try {
    const db = getDatabase();
    const {
      repo_path,
      commit_hash,
      commit_message,
      timestamp,
      files_count,
      push_success
    } = data;

    const query = `
      INSERT INTO commits 
      (repo_path, commit_hash, commit_message, timestamp, files_count, push_success)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(query).run(
      repo_path,
      commit_hash,
      commit_message,
      timestamp,
      files_count || 0,
      push_success ? 1 : 0
    );

    return { id: result.lastInsertRowid, ...data };
  } catch (error) {
    console.error('Database insert error:', error.message);
    throw error;
  }
}

/**
 * Get config value by key
 * @param {string} key - Config key
 * @returns {string|null} Config value or null
 */
export function getConfig(key) {
  try {
    const db = getDatabase();
    const query = 'SELECT value FROM config WHERE key = ?';
    const result = db.prepare(query).get(key);
    return result ? result.value : null;
  } catch (error) {
    console.error('Database access error:', error.message);
    return null;
  }
}

/**
 * Set config value
 * @param {string} key - Config key
 * @param {string} value - Config value
 * @returns {boolean} Success status
 */
export function setConfig(key, value) {
  try {
    const db = getDatabase();
    const query = 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)';
    db.prepare(query).run(key, value);
    return true;
  } catch (error) {
    console.error('Database insert error:', error.message);
    return false;
  }
}

export default {
  getRemoteSwitchCount,
  getAllAnalytics,
  logAnalytics,
  getAllCommits,
  logCommit,
  getConfig,
  setConfig
};
