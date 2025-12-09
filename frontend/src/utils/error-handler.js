/**
 * System: ITL411 Pokémon API
 * Module: Error Handler
 * File URL: frontend/src/utils/error-handler.js
 */

export const ErrorHandler = {
  log(context, error) {
    console.error(`[${context}] Error:`, error);
  },

  format(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'An unexpected error occurred.';
  }
};