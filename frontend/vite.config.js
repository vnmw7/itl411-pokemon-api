import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.', // Since index.html is in frontend/
  test: {
    environment: 'jsdom', // Required for DOM testing
    globals: true,
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules']
  }
});