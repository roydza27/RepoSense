# Frontend Integration Examples

## 🔗 Connecting Frontend to Backend

Backend runs on: `http://localhost:5000`
Frontend runs on: `http://localhost:5173` (Vite default)

CORS is already enabled for frontend origins.

---

## 📡 Git Operations API

### Get Repository Status

```javascript
async function getRepoStatus(workspacePath) {
  const response = await fetch('http://localhost:5000/api/repo/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath })
  });
  
  const data = await response.json();
  // { success: true, files: [{ status: 'M', filepath: 'src/app.js' }, ...] }
  return data;
}
```

### Get Repository Diff Stats

```javascript
async function getRepoDiff(workspacePath) {
  const response = await fetch('http://localhost:5000/api/repo/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath })
  });
  
  const data = await response.json();
  // { 
  //   success: true,
  //   filesChanged: 5,
  //   linesAdded: 50,
  //   linesRemoved: 10,
  //   summary: "5 files changed, 50 insertions(+), 10 deletions(-)"
  // }
  return data;
}
```

### Get AI Commit Suggestion

```javascript
async function suggestCommitMessage(workspacePath) {
  const response = await fetch('http://localhost:5000/api/ai/suggest-commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath })
  });
  
  const data = await response.json();
  // { success: true, suggestion: 'Update src/app.js component' }
  return data;
}
```

### Commit and Push Changes

```javascript
async function commitAndPush(workspacePath, message, autoPush = true, forcePush = false) {
  const response = await fetch('http://localhost:5000/api/repo/commit-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspacePath,
      message,
      autoPush,
      forcePush
    })
  });
  
  const data = await response.json();
  // {
  //   success: true,
  //   committed: true,
  //   pushed: true,
  //   commitHash: 'abc123def456',
  //   filesChanged: 5,
  //   linesAdded: 50,
  //   linesRemoved: 10
  // }
  return data;
}
```

### Push to Remote

```javascript
async function pushToRemote(workspacePath, forcePush = false) {
  const response = await fetch('http://localhost:5000/api/repo/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath, forcePush })
  });
  
  const data = await response.json();
  // { success: true, message: 'Pushed successfully', forcePushed: false }
  return data;
}
```

### Pull from Remote

```javascript
async function pullFromRemote(workspacePath, rebase = false) {
  const response = await fetch('http://localhost:5000/api/repo/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath, rebase })
  });
  
  const data = await response.json();
  // { success: true, message: 'Pulled successfully', output: '...' }
  return data;
}
```

### Sync Repository (Pull then Push)

```javascript
async function syncRepository(workspacePath, forcePush = false) {
  const response = await fetch('http://localhost:5000/api/repo/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath, forcePush })
  });
  
  const data = await response.json();
  // { success: true, pulled: true, pushed: true }
  return data;
}
```

### Resolve Merge Conflicts

```javascript
async function resolveConflicts(workspacePath, strategy) {
  // strategy: 'ours' or 'theirs'
  const response = await fetch('http://localhost:5000/api/repo/resolve-conflicts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspacePath, strategy })
  });
  
  const data = await response.json();
  // { success: true, message: 'Conflicts resolved using ours version' }
  return data;
}
```

---

## 📊 Analytics Reporting API

### Example 1: Get All Reports

```javascript
async function fetchAllReports() {
  try {
    const response = await fetch('http://localhost:5000/api/reports', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Reports:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
  }
}

// Usage
fetchAllReports();
```

### Example 2: Get Reports Summary

```javascript
async function fetchReportsSummary() {
  try {
    const response = await fetch('http://localhost:5000/api/reports/summary');
    const data = await response.json();
    
    console.log('Summary:', data.data);
    // {
    //   total_analytics_events: 10,
    //   total_commits: 5,
    //   remote_switches: 2,
    //   timestamp: "2026-04-23T..."
    // }
    
    return data.data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Example 3: Log Analytics Event

```javascript
async function logAnalyticsEvent(repoPath, action) {
  try {
    const response = await fetch('http://localhost:5000/api/reports/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo_path: repoPath,
        action: action,
        files_changed: 5,
        lines_added: 50,
        lines_removed: 10,
        success: true,
        error_message: null
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Event logged:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

// Usage
logAnalyticsEvent('/path/to/repo', 'remote_switch');
```

### Example 4: Log Commit

```javascript
async function logCommit(repoPath, commitHash, message) {
  try {
    const response = await fetch('http://localhost:5000/api/reports/commits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        repo_path: repoPath,
        commit_hash: commitHash,
        commit_message: message,
        files_count: 10,
        push_success: true
      })
    });

    const data = await response.json();
    console.log('Commit logged:', data.data);
    return data.data;
  } catch (error) {
    console.error('Error logging commit:', error);
  }
}

// Usage
logCommit('/path/to/repo', 'abc123def456', 'Initial commit');
```

---

## 🔨 Using Axios

First, install axios in frontend:

```bash
npm install axios
```

### Create API Service (`src/services/api.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getReports = (filters = {}) => 
  apiClient.get('/reports', { params: filters });

export const getReportsSummary = () => 
  apiClient.get('/reports/summary');

export const getRemoteSwitches = () => 
  apiClient.get('/reports/remote-switches');

export const logAnalyticsEvent = (data) => 
  apiClient.post('/reports/analytics', data);

export const logCommit = (data) => 
  apiClient.post('/reports/commits', data);

export default apiClient;
```

### Example: React Component Using Axios

```jsx
import { useEffect, useState } from 'react';
import { getReportsSummary, logAnalyticsEvent } from '../services/api';

export function AnalyticsPanel() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    try {
      setLoading(true);
      const response = await getReportsSummary();
      setSummary(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogEvent() {
    try {
      await logAnalyticsEvent({
        repo_path: '/path/to/repo',
        action: 'remote_switch',
        files_changed: 5,
        lines_added: 50,
        lines_removed: 10,
        success: true
      });
      // Refresh summary
      fetchSummary();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Analytics Summary</h2>
      {summary && (
        <>
          <p>Total Events: {summary.total_analytics_events}</p>
          <p>Total Commits: {summary.total_commits}</p>
          <p>Remote Switches: {summary.remote_switches}</p>
        </>
      )}
      <button onClick={handleLogEvent}>Log Event</button>
    </div>
  );
}
```

---

## 🧪 Testing with cURL

```bash
# Get all reports
curl -X GET http://localhost:5000/api/reports

# Get summary
curl -X GET http://localhost:5000/api/reports/summary

# Get remote switches
curl -X GET http://localhost:5000/api/reports/remote-switches

# Log analytics event
curl -X POST http://localhost:5000/api/reports/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "repo_path": "/path/to/repo",
    "action": "remote_switch",
    "files_changed": 5,
    "lines_added": 50,
    "lines_removed": 10,
    "success": true
  }'

# Log commit
curl -X POST http://localhost:5000/api/reports/commits \
  -H "Content-Type: application/json" \
  -d '{
    "repo_path": "/path/to/repo",
    "commit_hash": "abc123def456",
    "commit_message": "Initial commit",
    "files_count": 10,
    "push_success": true
  }'
```

---

## 🌐 Environment Setup for Frontend

Add to your `.env` file in frontend:

```
VITE_API_URL=http://localhost:5000
```

Then use it:

```javascript
const API_URL = import.meta.env.VITE_API_URL;

fetch(`${API_URL}/api/reports`)
```

