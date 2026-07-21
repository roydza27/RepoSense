import fetch from 'node-fetch';

/**
 * Logging and telemetry middleware
 * Sends metrics to telemetry service
 */
export function telemetryMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const payload = {
      route: req.originalUrl.split('?')[0],
      method: req.method,
      status: res.statusCode,
      responseTime: Date.now() - start,
      isError: res.statusCode >= 400,
      sourcePort: process.env.PORT || 5000,
      service_name: 'reposense',
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('http://localhost:3002/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(700)
      });
    } catch (error) {
      // Telemetry must NEVER break production traffic
      console.debug('Telemetry delivery failed (non-critical):', error.message);
    }
  });

  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

export default {
  telemetryMiddleware,
  errorHandler,
  requestLogger
};
