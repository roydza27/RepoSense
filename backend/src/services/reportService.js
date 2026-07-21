import {
  getRemoteSwitchCount,
  getAllAnalytics,
  logAnalytics,
  getAllCommits,
  logCommit
} from '../models/reportModel.js';

/**
 * Get remote switch analytics
 * @returns {Object} Analytics with switch count
 */
export function getRemoteSwitchAnalytics() {
  try {
    const remoteSwitchCount = getRemoteSwitchCount();
    const allAnalytics = getAllAnalytics({ action: 'remote_switch' });
    
    return {
      total_switches: remoteSwitchCount,
      records: allAnalytics,
      success: true
    };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      total_switches: 0,
      records: [],
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all available reports/analytics
 * @param {Object} filters - Filter options
 * @returns {Object} Report data with metadata
 */
export function getAvailableReports(filters = {}) {
  try {
    const analytics = getAllAnalytics(filters);
    const commits = getAllCommits(filters);

    return {
      analytics: analytics,
      commits: commits,
      analytics_count: analytics.length,
      commits_count: commits.length,
      success: true
    };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      analytics: [],
      commits: [],
      analytics_count: 0,
      commits_count: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Record a new analytics event
 * @param {Object} analyticsData - Event data
 * @returns {Object} Response with recorded data
 */
export function recordAnalyticsEvent(analyticsData) {
  try {
    const result = logAnalytics({
      ...analyticsData,
      timestamp: analyticsData.timestamp || new Date().toISOString()
    });

    return {
      success: true,
      data: result,
      message: 'Analytics event recorded successfully'
    };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to record analytics event'
    };
  }
}

/**
 * Record a new commit
 * @param {Object} commitData - Commit data
 * @returns {Object} Response with recorded data
 */
export function recordCommit(commitData) {
  try {
    const result = logCommit({
      ...commitData,
      timestamp: commitData.timestamp || new Date().toISOString()
    });

    return {
      success: true,
      data: result,
      message: 'Commit recorded successfully'
    };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to record commit'
    };
  }
}

/**
 * Get combined report summary
 * @returns {Object} Summary of all reports
 */
export function getReportSummary() {
  try {
    const remoteSwitchCount = getRemoteSwitchCount();
    const allAnalytics = getAllAnalytics();
    const allCommits = getAllCommits();

    return {
      success: true,
      summary: {
        total_analytics_events: allAnalytics.length,
        total_commits: allCommits.length,
        remote_switches: remoteSwitchCount,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      success: false,
      error: error.message,
      summary: null
    };
  }
}

/**
 * Get analytics dashboard data
 * Mimics /api/analytics from old backend
 * @returns {Object} Analytics data
 */
export function getAnalyticsData() {
  try {
    const allCommits = getAllCommits();
    const successfulPushes = allCommits.filter(c => c.push_success === 1);
    const totalFiles = allCommits.reduce((sum, c) => sum + (c.files_count || 0), 0);
    
    const allAnalytics = getAllAnalytics({ action: 'commit_push' });
    const linesAdded = allAnalytics.reduce((sum, a) => sum + (a.lines_added || 0), 0);
    const linesRemoved = allAnalytics.reduce((sum, a) => sum + (a.lines_removed || 0), 0);
    
    const remoteSwitches = getRemoteSwitchCount();
    
    // Calculate commit streak (simplified)
    let streak = 0;
    if (allCommits.length > 0) {
      const dates = new Set();
      allCommits.forEach(c => {
        const date = c.timestamp?.split('T')[0];
        if (date) dates.add(date);
      });
      
      let currentDate = new Date().toISOString().split('T')[0];
      for (let d of Array.from(dates).sort().reverse()) {
        if (d === currentDate) {
          streak++;
          const date = new Date(currentDate);
          date.setDate(date.getDate() - 1);
          currentDate = date.toISOString().split('T')[0];
        } else {
          break;
        }
      }
    }
    
    // Time saved: 6 seconds per commit
    const timeSaved = allCommits.length * 6;
    
    // Success rate
    const pushSuccessRate = allCommits.length > 0
      ? ((successfulPushes.length / allCommits.length) * 100).toFixed(1)
      : '0';
    
    const lastCommit = allCommits.length > 0
      ? allCommits[0].timestamp?.split('T')[0]
      : null;

    return {
      totalCommits: allCommits.length,
      successfulPushes: successfulPushes.length,
      totalFilesChanged: totalFiles,
      linesAdded,
      linesRemoved,
      remoteSwitches,
      commitStreak: streak,
      timeSavedSeconds: timeSaved,
      pushSuccessRate,
      lastCommit
    };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      totalCommits: 0,
      successfulPushes: 0,
      totalFilesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
      remoteSwitches: 0,
      commitStreak: 0,
      timeSavedSeconds: 0,
      pushSuccessRate: '0',
      lastCommit: null,
      error: error.message
    };
  }
}

/**
 * Get activity logs
 * Mimics /api/logs from old backend
 * @returns {Object} Logs data
 */
export function getLogsData() {
  try {
    const logs = getAllAnalytics().slice(0, 50);
    return { logs };
  } catch (error) {
    console.error('Service error:', error.message);
    return {
      logs: [],
      error: error.message
    };
  }
}

export default {
  getRemoteSwitchAnalytics,
  getAvailableReports,
  recordAnalyticsEvent,
  recordCommit,
  getReportSummary,
  getAnalyticsData,
  getLogsData
};
