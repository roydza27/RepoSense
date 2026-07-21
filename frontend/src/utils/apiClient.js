/**
 * Standardized API Client
 * - Checks HTTP status AND response.success field
 * - Throws meaningful errors
 * - No silent failures
 * - Consistent error handling across the app
 */

const API_BASE = '/api';

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  /**
   * Make API request with standardized error handling
   * Ensures:
   * 1. res.ok (HTTP 2xx)
   * 2. data.success field exists
   * Throws error with meaningful message if either fails
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      // Check HTTP status
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Check response.success field
      if (data.success === false) {
        throw new Error(data?.error || 'API returned success: false');
      }

      // Success case
      if (data.success === true) {
        return data;
      }

      // Endpoint without explicit success field (fallback for legacy endpoints)
      // Assume success if no error and 2xx status
      return data;
    } catch (error) {
      // Re-throw with consistent format
      throw new Error(error.message);
    }
  }

  /**
   * POST request - commonly used for API calls
   */
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export default new APIClient();
