/**
 * System: ITL411 Pokémon API
 * Module: API Client
 * File URL: frontend/src/utils/api-client.js
 */

export async function apiClient(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP Error ${response.status}: ${response.statusText}`
      };
    }

    const json = await response.json();
    
    // Normalize: Backend sometimes returns { data: [...] } or { data: { results: [...] } }
    const data = json.data?.results || json.data || json;

    return { success: true, data: data };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network connection failed'
    };
  }
}