import React, { useState, useRef } from 'react';
import { GitCommit, Upload, Sparkles, FileText, Loader, Download, RefreshCw, AlertTriangle, Shield, Zap } from 'lucide-react';
import apiClient from '../utils/apiClient';

function CommitPanel({ workspacePath, repoData, onRefresh, onLog }) {
  const [commitMessage, setCommitMessage] = useState('');
  const [autoPush, setAutoPush] = useState(true);
  const [forcePush, setForcePush] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState(null);
  const [diff, setDiff] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [pullNeeded, setPullNeeded] = useState(false);
  const [showConflictResolver, setShowConflictResolver] = useState(false);

  // Execution locks to prevent duplicate API calls
  const executingRef = useRef({
    loadStatus: false,
    loadDiff: false,
    suggestCommit: false,
  });

  /**
   * Load repository status
   * Called manually on demand (not on mount)
   */
  const loadStatus = async () => {
    if (executingRef.current.loadStatus || !workspacePath) return;

    executingRef.current.loadStatus = true;
    try {
      const data = await apiClient.post('/repo/status', { workspacePath });
      setStatus(data.data || data);
    } catch (error) {
      console.error('Failed to load status:', error);
      onLog(`✗ Failed to load status: ${error.message}`, 'error');
    } finally {
      executingRef.current.loadStatus = false;
    }
  };

  /**
   * Load repository diff
   * Called manually on demand (not on mount)
   */
  const loadDiff = async () => {
    if (executingRef.current.loadDiff || !workspacePath) return;

    executingRef.current.loadDiff = true;
    try {
      const data = await apiClient.post('/repo/diff', { workspacePath });
      setDiff(data.data || data);
    } catch (error) {
      console.error('Failed to load diff:', error);
      // Silent fail for non-critical diff
    } finally {
      executingRef.current.loadDiff = false;
    }
  };

  /**
   * Load status and diff together
   */
  const loadStatusAndDiff = async () => {
    await Promise.all([loadStatus(), loadDiff()]);
  };

  const handleSuggestCommit = async () => {
    if (executingRef.current.suggestCommit || !workspacePath) return;

    executingRef.current.suggestCommit = true;
    onLog('Generating commit message suggestion...', 'info');
    
    try {
      const data = await apiClient.post('/ai/suggest-commit', { workspacePath });
      const suggestion = data.data?.suggestion || data.suggestion || 'Update files';
      setSuggestion(suggestion);
      setCommitMessage(suggestion);
      onLog('✓ Suggestion generated', 'success');
    } catch (error) {
      onLog(`✗ Error: ${error.message}`, 'error');
    } finally {
      executingRef.current.suggestCommit = false;
    }
  };

  const handleCommitPush = async () => {
    if (!commitMessage.trim()) {
      onLog('✗ Commit message is required', 'error');
      return;
    }

    setIsCommitting(true);
    setPullNeeded(false);
    onLog('Committing changes...', 'info');
    
    try {
      const data = await apiClient.post('/repo/commit-push', {
        workspacePath,
        message: commitMessage,
        autoPush,
        forcePush
      });
      
      if (data.success && data.data) {
        const result = data.data;
        if (result.committed) {
          onLog(`✓ Committed: ${result.filesChanged} files changed`, 'success');
          
          if (autoPush) {
            if (result.pushed) {
              if (result.forcePushed) {
                onLog('✓ Force pushed to remote successfully', 'success');
              } else {
                onLog('✓ Pushed to remote successfully', 'success');
              }
              setPullNeeded(false);
            } else {
              if (result.pullNeeded) {
                onLog('⚠ Push rejected: Remote has newer commits. Pull first or use Force Push', 'error');
                setPullNeeded(true);
              } else {
                onLog(`✗ Push failed: ${result.pushError}`, 'error');
              }
            }
          }
          
          setCommitMessage('');
          setSuggestion('');
          setForcePush(false);
          
          // Refresh parent and reload status/diff
          onRefresh();
          await loadStatusAndDiff();
        } else {
          onLog(result.message || 'No changes to commit', 'info');
        }
      } else {
        onLog(`✗ Commit failed: ${data.error}`, 'error');
      }
    } catch (error) {
      onLog(`✗ Error: ${error.message}`, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePushOnly = async () => {
    setIsPushing(true);
    setPullNeeded(false);
    onLog(forcePush ? 'Force pushing to remote...' : 'Pushing to remote...', 'info');
    
    try {
      const data = await apiClient.post('/repo/push', { 
        workspacePath, 
        forcePush 
      });
      
      if (data.success) {
        onLog(`✓ ${data.data?.message || 'Pushed successfully'}`, 'success');
        setPullNeeded(false);
        setForcePush(false);
        await loadStatusAndDiff();
      } else {
        onLog(`✗ Push failed: ${data.error}`, 'error');
        if (data.data?.pullNeeded) {
          onLog('⚠ Remote has newer commits. Pull first or use Force Push', 'error');
          setPullNeeded(true);
        }
      }
    } catch (error) {
      onLog(`✗ Error: ${error.message}`, 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    onLog('Pulling from remote...', 'info');
    
    try {
      const data = await apiClient.post('/repo/pull', { 
        workspacePath, 
        rebase: false 
      });
      
      if (data.success) {
        onLog('✓ Pulled successfully', 'success');
        setPullNeeded(false);
        onRefresh();
        await loadStatusAndDiff();
      } else {
        onLog(`✗ Pull failed: ${data.error}`, 'error');
        if (data.error?.includes('conflict')) {
          setShowConflictResolver(true);
        }
      }
    } catch (error) {
      onLog(`✗ Error: ${error.message}`, 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    onLog('Syncing with remote (pull + push)...', 'info');
    
    try {
      const data = await apiClient.post('/repo/sync', { 
        workspacePath, 
        forcePush 
      });
      
      if (data.success) {
        onLog('✓ Synced successfully', 'success');
        setPullNeeded(false);
        setForcePush(false);
        onRefresh();
        await loadStatusAndDiff();
      } else {
        if (data.data?.hasConflicts) {
          onLog('✗ Merge conflicts detected. Use conflict resolver', 'error');
          setShowConflictResolver(true);
        } else {
          onLog(`✗ Sync failed: ${data.error}`, 'error');
        }
      }
    } catch (error) {
      onLog(`✗ Error: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflicts = async (strategy) => {
    onLog(`Resolving conflicts with ${strategy} version...`, 'info');
    
    try {
      const data = await apiClient.post('/repo/resolve-conflicts', {
        workspacePath,
        strategy
      });
      
      if (data.success) {
        onLog(`✓ Conflicts resolved using ${strategy} version`, 'success');
        setShowConflictResolver(false);
        onRefresh();
        await loadStatusAndDiff();
      } else {
        onLog(`✗ Failed to resolve conflicts: ${data.error}`, 'error');
      }
    } catch (error) {
      onLog(`✗ Error: ${error.message}`, 'error');
    }
  };

  if (!repoData) {
    return (
      <div className="card">
        <p className="text-gray-400 text-sm">
          Initialize or detect a repository first.
        </p>
      </div>
    );
  }

  const hasChanges = status?.data?.files && status.data.files.length > 0;

  return (
    <div className="space-y-4">
      {/* Commit Changes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Commit Changes</h2>
          <GitCommit className="w-5 h-5 text-primary-500" />
        </div>

        {/* Diff Summary */}
        {diff && diff.data && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Changes Preview</div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-gray-300">
                <FileText className="w-3 h-3 inline mr-1" />
                {diff.data.filesChanged} files
              </span>
              <span className="text-green-400">+{diff.data.linesAdded}</span>
              <span className="text-red-400">-{diff.data.linesRemoved}</span>
            </div>
            {diff.data.summary && (
              <div className="text-xs text-gray-500 mt-2">{diff.data.summary}</div>
            )}
          </div>
        )}

        {/* Changed Files */}
        {status?.data?.files && status.data.files.length > 0 && (
          <div className="mb-4 max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-400 mb-2">Modified Files (<span onClick={loadStatusAndDiff} className="cursor-pointer text-primary-400 hover:text-primary-300">refresh</span>)</div>
            <div className="space-y-1">
              {status.data.files.map((file, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-300 flex items-center space-x-2 bg-gray-900 rounded px-2 py-1"
                >
                  <span className={`font-mono ${
                    file.status.includes('M') ? 'text-yellow-500' :
                    file.status.includes('A') || file.status.includes('??') ? 'text-green-500' :
                    file.status.includes('D') ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {file.status}
                  </span>
                  <span className="truncate">{file.filepath}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasChanges && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4 border border-gray-700">
            <p className="text-sm text-gray-400">No changes to commit</p>
          </div>
        )}

        {/* Commit Message */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Commit Message</label>
              <button
                onClick={handleSuggestCommit}
                disabled={!hasChanges}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Suggest</span>
              </button>
            </div>
            
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Update components and fix styling"
              className="input-field w-full"
              disabled={!hasChanges}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleCommitPush();
                }
              }}
            />
            
            {suggestion && suggestion !== commitMessage && (
              <div className="text-xs text-gray-500 mt-1">
                Suggestion: {suggestion}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoPush"
                checked={autoPush}
                onChange={(e) => setAutoPush(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="autoPush" className="text-sm text-gray-400">
                Auto-push after commit
              </label>
            </div>

            {autoPush && (
              <div className="flex items-center space-x-2 ml-6">
                <input
                  type="checkbox"
                  id="forcePush"
                  checked={forcePush}
                  onChange={(e) => setForcePush(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <label htmlFor="forcePush" className="text-sm text-gray-400 flex items-center space-x-1">
                  <span>Force push</span>
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                </label>
              </div>
            )}

            {forcePush && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-2 ml-6">
                <p className="text-xs text-yellow-400 flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Force push will overwrite remote history. Use with caution!</span>
                </p>
              </div>
            )}

            {pullNeeded && (
              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-2">
                <p className="text-xs text-orange-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Remote has newer commits. Pull first or enable Force Push</span>
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleCommitPush}
            disabled={!hasChanges || !commitMessage.trim() || isCommitting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isCommitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Committing...</span>
              </>
            ) : (
              <>
                <GitCommit className="w-4 h-4" />
                <span>Commit{autoPush ? ' & Push' : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sync Operations */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Sync Operations</h3>
        
        <div className="space-y-2">
          {/* Pull Button */}
          <button
            onClick={handlePull}
            disabled={isPulling}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            {isPulling ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Pulling...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Pull from Remote</span>
              </>
            )}
          </button>

          {/* Push Button */}
          <button
            onClick={handlePushOnly}
            disabled={isPushing}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            {isPushing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Pushing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Push to Remote</span>
              </>
            )}
          </button>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            {isSyncing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Sync (Pull + Push)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommitPanel;