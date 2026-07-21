import React, { useState, useEffect, useRef } from 'react';
import { GitBranch, GitCommit, Activity, Settings, BarChart3, RefreshCw, Zap } from 'lucide-react';
import RepoPanel from './components/RepoPanel';
import CommitPanel from './components/CommitPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import ActivityFeed from './components/ActivityFeed';
import SettingsModal from './components/SettingsModal';
import AutoPushPanel from './components/AutoPushPanel';
import apiClient from './utils/apiClient';

function App() {
  // ===== STATE =====
  const [workspacePath, setWorkspacePath] = useState(localStorage.getItem('workspacePath') || '');
  const [repoData, setRepoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [autoPushStats, setAutoPushStats] = useState(null);
  const [autoPushHistory, setAutoPushHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // ===== EXECUTION LOCKS (prevent duplicate simultaneous calls) =====
  const executingRef = useRef({
    detectRepo: false,
    loadAnalytics: false,
    loadLogs: false,
    loadAutoPushStats: false,
    loadAutoPushHistory: false,
  });

  // ===== ADD LOG ENTRY =====
  const addLog = (msg, type = 'info') => {
    setLogs(prev => [
      { 
        id: Date.now(), 
        timestamp: new Date().toISOString(), 
        action: msg, 
        success: type === 'success' ? 1 : type === 'error' ? 0 : null 
      }, 
      ...prev.slice(0, 49)
    ]);
  };

  // ===== DETECT REPOSITORY =====
  const detectRepo = async () => {
    // Early return if already executing OR no path
    if (executingRef.current.detectRepo || !workspacePath) return;

    executingRef.current.detectRepo = true;
    setIsLoading(true);
    addLog('Detecting repository...', 'info');

    try {
      const data = await apiClient.post('/repo/detect', { workspacePath });
      
      // Check if response contains repo data
      if (data.data && data.data.isRepo) {
        setRepoData(data.data);
        addLog(`✓ Repository detected: ${data.data.repoName || 'Git Repo'}`, 'success');
      } else {
        setRepoData(null);
        addLog('✗ No Git repository found in workspace', 'error');
      }
    } catch (err) {
      console.error('detectRepo error:', err);
      setRepoData(null);
      addLog(`✗ Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
      executingRef.current.detectRepo = false;
    }
  };

  // ===== LOAD ANALYTICS =====
  const loadAnalytics = async () => {
    if (executingRef.current.loadAnalytics) return;

    executingRef.current.loadAnalytics = true;
    try {
      const data = await apiClient.get('/analytics');
      setAnalytics(data || {});
    } catch (err) {
      console.error('loadAnalytics error:', err);
      // Silent fail for analytics - non-critical
    } finally {
      executingRef.current.loadAnalytics = false;
    }
  };

  // ===== LOAD LOGS =====
  const loadLogs = async () => {
    if (executingRef.current.loadLogs) return;

    executingRef.current.loadLogs = true;
    try {
      const data = await apiClient.get('/logs');
      setLogs((data?.logs || []).slice(0, 50));
    } catch (err) {
      console.error('loadLogs error:', err);
      // Silent fail for logs - non-critical
    } finally {
      executingRef.current.loadLogs = false;
    }
  };

  // ===== LOAD AUTO-PUSH STATS =====
  const loadAutoPushStats = async () => {
    if (executingRef.current.loadAutoPushStats) return;

    executingRef.current.loadAutoPushStats = true;
    try {
      const data = await apiClient.get('/repo/auto-push/stats');
      setAutoPushStats(data.data || {});
    } catch (err) {
      console.error('loadAutoPushStats error:', err);
      // Silent fail - non-critical
    } finally {
      executingRef.current.loadAutoPushStats = false;
    }
  };

  // ===== LOAD AUTO-PUSH HISTORY =====
  const loadAutoPushHistory = async () => {
    if (executingRef.current.loadAutoPushHistory || !workspacePath) return;

    executingRef.current.loadAutoPushHistory = true;
    try {
      const data = await apiClient.post('/repo/auto-push/history', { workspacePath, limit: 10 });
      setAutoPushHistory(data.data?.jobs || []);
    } catch (err) {
      console.error('loadAutoPushHistory error:', err);
      // Silent fail - non-critical
    } finally {
      executingRef.current.loadAutoPushHistory = false;
    }
  };

  // ===== REFRESH ALL DATA (manual trigger) =====
  const refreshData = async () => {
    await Promise.all([
      detectRepo(),
      loadAnalytics(),
      loadLogs(),
      loadAutoPushStats(),
      loadAutoPushHistory(),
    ]);
  };

  // ===== HANDLE WORKSPACE CHANGE =====
  const handleWorkspaceChange = (p) => {
    setWorkspacePath(p);
    localStorage.setItem('workspacePath', p);
  };

  // ===== MAIN EFFECT: Load data when workspace path changes =====
  useEffect(() => {
    if (!workspacePath) {
      setRepoData(null);
      return;
    }

    // Load all data once on workspace change
    const initializeWorkspace = async () => {
      await Promise.all([
        detectRepo(),
        loadAnalytics(),
        loadLogs(),
        loadAutoPushStats(),
        loadAutoPushHistory(),
      ]);
    };

    initializeWorkspace();
  }, [workspacePath]);

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">RepoSense</h1>
              <p className="text-sm text-gray-400">GitHub Control Center</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={refreshData} 
              disabled={isLoading}
              className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {!workspacePath && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">No workspace selected</p>
            <button 
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Configure Workspace
            </button>
          </div>
        </div>
      )}

      {workspacePath && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg border border-gray-700">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('autopush')} 
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'autopush' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Auto-Push</span>
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <RepoPanel 
                  workspacePath={workspacePath} 
                  repoData={repoData} 
                  isLoading={isLoading} 
                  onRefresh={detectRepo} 
                  onLog={addLog} 
                />
              </div>
              <div className="lg:col-span-1">
                <CommitPanel 
                  workspacePath={workspacePath} 
                  repoData={repoData} 
                  onRefresh={refreshData} 
                  onLog={addLog} 
                />
              </div>
              <div className="lg:col-span-1">
                <ActivityFeed logs={logs} />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel analytics={analytics} onRefresh={loadAnalytics} />
          )}

          {activeTab === 'autopush' && (
            <AutoPushPanel 
              workspacePath={workspacePath} 
              repoData={repoData} 
              stats={autoPushStats} 
              history={autoPushHistory} 
              onLog={addLog} 
              onRefresh={loadAutoPushStats}
              isActive={activeTab === 'autopush'}
            />
          )}
        </div>
      )}

      {showSettings && (
        <SettingsModal 
          workspacePath={workspacePath} 
          onClose={() => setShowSettings(false)} 
          onWorkspaceChange={handleWorkspaceChange} 
          onLog={addLog} 
        />
      )}
    </div>
  );
}

export default App;
