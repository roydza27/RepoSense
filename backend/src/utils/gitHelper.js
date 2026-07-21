import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Execute a Git command in a specific directory
 * @param {string} command - Git command to execute (e.g., 'git status')
 * @param {string} cwd - Working directory path
 * @returns {Promise<Object>} { success: boolean, output: string, error: string, stderr: string }
 */
export async function executeGit(command, cwd = null) {
  try {
    const options = cwd ? { cwd } : {};
    const { stdout, stderr } = await execAsync(command, options);
    return { success: true, output: stdout.trim(), error: '', stderr: stderr.trim() };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      stderr: error.stderr || ''
    };
  }
}

/**
 * Parse git diff stats
 * @param {string} diffOutput - Output from 'git diff --shortstat'
 * @returns {Object} { filesChanged, linesAdded, linesRemoved }
 */
export function parseDiffStats(diffOutput) {
  let filesChanged = 0,
    linesAdded = 0,
    linesRemoved = 0;

  if (diffOutput) {
    const match = diffOutput.match(
      /(\d+) file[s]? changed(?:, (\d+) insertion[s]?\(\+\))?(?:, (\d+) deletion[s]?\(-\))?/
    );
    if (match) {
      filesChanged = parseInt(match[1]) || 0;
      linesAdded = parseInt(match[2]) || 0;
      linesRemoved = parseInt(match[3]) || 0;
    }
  }

  return { filesChanged, linesAdded, linesRemoved };
}

/**
 * Convert user-friendly error to Git explanation
 * @param {string} error - Error message
 * @returns {string} Friendly explanation
 */
export function explainGitError(error) {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('permission denied') || errorLower.includes('403')) {
    return 'Authentication failed. Check your GitHub credentials or access token.';
  }

  if (errorLower.includes('could not resolve host') || errorLower.includes('network')) {
    return 'Network error. Check your internet connection.';
  }

  if (errorLower.includes('failed to push') || errorLower.includes('rejected')) {
    return 'Push rejected. Pull latest changes first or force push if needed.';
  }

  if (errorLower.includes('not a git repository')) {
    return 'This folder is not a Git repository. Initialize one first.';
  }

  if (errorLower.includes('nothing to commit')) {
    return 'No changes to commit. All files are up to date.';
  }

  if (errorLower.includes('merge conflict')) {
    return 'Merge conflict detected. Resolve conflicts manually first.';
  }

  return 'Git operation failed. Check the error details above.';
}

/**
 * Generate AI-like commit message based on files changed
 * @param {string} changedFiles - Output from 'git status --porcelain'
 * @returns {string} Suggested commit message
 */
export function generateCommitSuggestion(changedFiles) {
  if (!changedFiles || !changedFiles.trim()) {
    return 'Update files';
  }

  const files = changedFiles.split('\n').filter(line => line.trim());

  // Single file case
  if (files.length === 1) {
    const file = files[0].substring(3);
    const ext = extractFileExtension(file);

    if (isCodeFile(ext)) {
      return `Update ${extractFileName(file)} component`;
    } else if (ext === '.css' || ext === '.scss') {
      return `Style ${extractFileNameWithoutExt(file)}`;
    } else if (ext === '.md') {
      return `Update documentation`;
    } else {
      return `Update ${extractFileName(file)}`;
    }
  }

  // Few files (1-3)
  if (files.length <= 3) {
    return `Update ${files.length} files`;
  }

  // Multiple files - analyze types
  const hasNew = files.some(f => f.startsWith('A ') || f.startsWith('??'));
  const hasModified = files.some(f => f.startsWith('M '));
  const hasDeleted = files.some(f => f.startsWith('D '));

  if (hasNew && hasModified) {
    return 'Add new features and update existing code';
  } else if (hasNew) {
    return 'Add new files and features';
  } else if (hasModified) {
    return 'Update multiple files';
  } else if (hasDeleted) {
    return 'Clean up and remove unused files';
  }

  return 'Update project files';
}

/**
 * Check if file extension is a code file
 * @param {string} ext - File extension
 * @returns {boolean}
 */
function isCodeFile(ext) {
  return ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.rb'].includes(ext);
}

/**
 * Extract file extension
 * @param {string} file - File path
 * @returns {string} Extension with dot
 */
function extractFileExtension(file) {
  const match = file.match(/(\.[^.]+)$/);
  return match ? match[1] : '';
}

/**
 * Extract just filename (no path)
 * @param {string} file - File path
 * @returns {string} Filename only
 */
function extractFileName(file) {
  const parts = file.split('/');
  return parts[parts.length - 1];
}

/**
 * Extract filename without extension
 * @param {string} file - File path
 * @returns {string} Filename without extension
 */
function extractFileNameWithoutExt(file) {
  const name = extractFileName(file);
  return name.replace(/\.[^.]+$/, '');
}

export default {
  executeGit,
  parseDiffStats,
  explainGitError,
  generateCommitSuggestion
};
