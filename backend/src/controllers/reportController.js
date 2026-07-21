import {
  getRemoteSwitchAnalytics,
  getAvailableReports,
  recordAnalyticsEvent,
  recordCommit,
  getReportSummary,
  getAnalyticsData,
  getLogsData
} from '../services/reportService.js';

/**
 * GET /api/reports - Get all available reports
 */
export async function getReports(req, res) {
  try {
    const { action, repo_path } = req.query;
    const filters = {};

    if (action) filters.action = action;
    if (repo_path) filters.repo_path = repo_path;

    const reports = getAvailableReports(filters);

    if (!reports.success) {
      return res.status(500).json({
        status: 'error',
        message: reports.error,
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve reports',
      error: error.message
    });
  }
}

/**
 * GET /api/reports/summary - Get report summary
 */
export async function getReportsSummary(req, res) {
  try {
    const summary = getReportSummary();

    if (!summary.success) {
      return res.status(500).json({
        status: 'error',
        message: summary.error,
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Summary retrieved successfully',
      data: summary.summary
    });
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve summary',
      error: error.message
    });
  }
}

/**
 * GET /api/reports/remote-switches - Get remote switch analytics
 */
export async function getRemoteSwitches(req, res) {
  try {
    const analytics = getRemoteSwitchAnalytics();

    if (!analytics.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve remote switches',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Remote switch analytics retrieved successfully',
      data: {
        total_switches: analytics.total_switches,
        records_count: analytics.records.length,
        records: analytics.records
      }
    });
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve remote switches',
      error: error.message
    });
  }
}

/**
 * POST /api/reports/analytics - Log an analytics event
 */
export async function logAnalyticEvent(req, res) {
  try {
    const {
      repo_path,
      action,
      files_changed,
      lines_added,
      lines_removed,
      success,
      error_message
    } = req.body;

    // Validation
    if (!repo_path || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: repo_path, action',
        data: null
      });
    }

    const result = recordAnalyticsEvent({
      repo_path,
      action,
      files_changed,
      lines_added,
      lines_removed,
      success,
      error_message
    });

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.message,
        data: null
      });
    }

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to log analytics event',
      error: error.message
    });
  }
}

/**
 * POST /api/reports/commits - Log a commit
 */
export async function logNewCommit(req, res) {
  try {
    const {
      repo_path,
      commit_hash,
      commit_message,
      files_count,
      push_success
    } = req.body;

    // Validation
    if (!repo_path || !commit_hash) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: repo_path, commit_hash',
        data: null
      });
    }

    const result = recordCommit({
      repo_path,
      commit_hash,
      commit_message,
      files_count,
      push_success
    });

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.message,
        data: null
      });
    }

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to log commit',
      error: error.message
    });
  }
}

/**
 * GET /api/analytics - Get analytics dashboard data
 */
export function getAnalytics(req, res) {
  try {
    const result = getAnalyticsData();
    res.status(200).json(result);
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
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
    });
  }
}

/**
 * GET /api/logs - Get activity logs
 */
export function getLogs(req, res) {
  try {
    const result = getLogsData();
    res.status(200).json(result);
  } catch (error) {
    console.error('Controller error:', error.message);
    res.status(500).json({
      logs: [],
      error: error.message
    });
  }
}

export default {
  getReports,
  getReportsSummary,
  getRemoteSwitches,
  logAnalyticEvent,
  logNewCommit,
  getAnalytics,
  getLogs
};
