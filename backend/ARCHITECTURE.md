# Backend Architecture Guide

## 📁 Folder Structure

```
backend/
├── src/
│   ├── app.js                 # Main Express app setup
│   ├── controllers/           # Request handlers
│   │   └── reportController.js
│   ├── routes/                # API route definitions
│   │   └── reportRoutes.js
│   ├── services/              # Business logic layer
│   │   └── reportService.js
│   ├── models/                # Database queries
│   │   └── reportModel.js
│   ├── database/              # DB connection & setup
│   │   └── connection.js
│   ├── middleware/            # Express middleware
│   │   └── index.js
│   ├── config/                # Configuration files
│   └── utils/                 # Utility functions
├── scripts/
│   └── viewDb.js              # Database viewer
├── package.json
├── .env
└── reposense.db               # SQLite database
```

## 🔄 Request Flow (MVC Pattern)

```
HTTP Request
    ↓
Route (reportRoutes.js)
    ↓
Controller (reportController.js) - Handles request/response
    ↓
Service (reportService.js) - Business logic
    ↓
Model (reportModel.js) - Database queries
    ↓
Database (connection.js) - SQLite
    ↓
Response
```

## 🎯 API Endpoints

### Base URL
```
http://localhost:5000
```

### Available Endpoints

#### GET Endpoints

**1. Health Check**
```
GET /health
Response: { status: 'ok', service: 'reposense-backend', uptime: ... }
```

**2. Get All Reports**
```
GET /api/reports
Query Params:
  - action: string (optional)
  - repo_path: string (optional)

Response:
{
  "status": "success",
  "data": {
    "analytics": [...],
    "commits": [...],
    "analytics_count": 5,
    "commits_count": 3
  }
}
```

**3. Get Reports Summary**
```
GET /api/reports/summary
Response:
{
  "status": "success",
  "data": {
    "total_analytics_events": 10,
    "total_commits": 5,
    "remote_switches": 2,
    "timestamp": "2026-04-23T..."
  }
}
```

**4. Get Remote Switches Analytics**
```
GET /api/reports/remote-switches
Response:
{
  "status": "success",
  "data": {
    "total_switches": 5,
    "records_count": 5,
    "records": [...]
  }
}
```

#### POST Endpoints

**5. Log Analytics Event**
```
POST /api/reports/analytics
Body:
{
  "repo_path": "/path/to/repo",
  "action": "remote_switch",
  "files_changed": 5,
  "lines_added": 50,
  "lines_removed": 10,
  "success": true,
  "error_message": null
}

Response:
{
  "status": "success",
  "message": "Analytics event recorded successfully",
  "data": { id, timestamp, ...}
}
```

**6. Log Commit**
```
POST /api/reports/commits
Body:
{
  "repo_path": "/path/to/repo",
  "commit_hash": "abc123def456",
  "commit_message": "Initial commit",
  "files_count": 10,
  "push_success": true
}

Response:
{
  "status": "success",
  "message": "Commit recorded successfully",
  "data": { id, timestamp, ...}
}
```

## 🎨 Layer Responsibilities

### 🔗 Routes (`src/routes/`)
- Define API endpoints
- Map HTTP methods to controllers
- No business logic

### 🎮 Controllers (`src/controllers/`)
- Handle HTTP requests/responses
- Validate input
- Call services for business logic
- Send responses

### 💼 Services (`src/services/`)
- Implement business logic
- Orchestrate between controllers and models
- Handle data transformation
- No direct HTTP or database access

### 📊 Models (`src/models/`)
- Pure database query functions
- No business logic
- Return raw data from database

### 🗄️ Database (`src/database/`)
- Connection setup
- Table creation
- Connection management

## 🚀 Setup & Running

### Installation

```bash
cd backend
npm install
```

### Start Server

```bash
# Development with watch mode
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:5000`

### View Database

```bash
npm run view-db
```

## 🔐 Environment Variables

Create `.env` file:

```
PORT=5000
NODE_ENV=development
DATABASE_PATH=./reposense.db
TELEMETRY_ENDPOINT=http://localhost:3002/api/metrics
```

## 📦 Dependencies

- **express**: Web framework
- **better-sqlite3**: SQLite database
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variables
- **node-fetch**: HTTP client

## ✨ Code Quality

- ✅ Clean modular functions
- ✅ Proper separation of concerns (MVC)
- ✅ No duplicate logic
- ✅ Professional naming conventions
- ✅ Comprehensive error handling
- ✅ No console.log debugging leftovers

