/**
 * Standardized API Response Helper
 * 
 * All endpoints MUST use this format:
 * Success: { success: true, data: {...} }
 * Error:   { success: false, error: "meaningful message" }
 * 
 * NEVER return:
 * - Different field names (isRepo, message, etc.)
 * - Raw service results
 * - Inconsistent structures
 */

export function sendSuccess(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data: data || {}
  });
}

export function sendError(res, error, statusCode = 400) {
  // Extract error message safely
  let errorMessage = 'Unknown error';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (error?.error) {
    errorMessage = error.error;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorMessage
  });
}
