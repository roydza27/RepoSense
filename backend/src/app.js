import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/connection.js';
import { telemetryMiddleware, errorHandler, requestLogger } from './middleware/index.js';
import reportRoutes from './routes/reportRoutes.js';
import gitRoutes from './routes/gitRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { getAnalytics, getLogs } from './controllers/reportController.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database on startup
try {
  initializeDatabase();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize database:', error.message);
  process.exit(1);
}

// Middleware - CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Middleware - Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware - Request logging
app.use(requestLogger);

// Middleware - Telemetry
app.use(telemetryMiddleware);

// Routes
app.use('/api/reports', reportRoutes);
app.use('/api/repo', gitRoutes);
app.use('/api/ai', aiRoutes);

// Frontend-specific convenience routes (match frontend expectations)
app.get('/api/analytics', getAnalytics);
app.get('/api/logs', getLogs);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'reposense-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'RepoSense Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      reports: '/api/reports',
      reports_summary: '/api/reports/summary',
      remote_switches: '/api/reports/remote-switches'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 RepoSense Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api\n`);
});

export default app;
