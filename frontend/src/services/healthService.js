/**
 * System: ITL411 Pokémon API
 * Module: Health Service
 * File URL: frontend/src/services/healthService.js
 * Purpose: Verify backend availability before making API calls
 */
import { API_BASE_URL } from '../config.js';

export const healthService = {
  /**
   * Check if backend is reachable
   * @returns {Promise<boolean>}
   */
  async isBackendReachable() {
    try {
      // Adjust path if API_BASE_URL includes /api/v1
      const baseUrl = API_BASE_URL.replace('/api/v1', '');
      const healthEndpoint = `${baseUrl}/health`;
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error.message);
      return false;
    }
  },

  /**
   * Get backend health status with details
   * @returns {Promise<{status: string, ml_service: string}>}
   */
  async getBackendStatus() {
    try {
      const baseUrl = API_BASE_URL.replace('/api/v1', '');
      const healthEndpoint = `${baseUrl}/health`;
      
      const response = await fetch(healthEndpoint);
      if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch backend status:', error);
      return { status: 'unavailable', error: error.message };
    }
  }
};