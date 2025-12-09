/**
 * System: ITL411 Pokémon API
 * Module: Vite Configuration
 * File URL: frontend/vite.config.js
 * Purpose: Production-ready Vite configuration with proxy and testing setup
 */

import { defineConfig } from 'vite';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  root: '.',
  server: isDev ? {
    proxy: {
      '/api': {
        target: 'https://lionfish-app-ff29q.ondigitalocean.app',
        changeOrigin: true,
        secure: true, // Verify SSL in dev too
        rewrite: (path) => path, // Keep original path intact
        logLevel: 'debug', // Enable debugging for troubleshooting
        onProxyRes: (proxyRes, req, res) => {
          // Add debugging headers
          proxyRes.headers['X-Proxied-By'] = 'Vite Dev Server';
        },
        onError: (err, req, res) => {
          console.error('Proxy error:', {
            path: req.url,
            error: err.message,
            target: 'https://lionfish-app-ff29q.ondigitalocean.app'
          });
          res.status(502).json({
            error: 'Backend service unavailable',
            message: err.message
          });
        }
      },
      '/health': {
        target: 'https://lionfish-app-ff29q.ondigitalocean.app',
        changeOrigin: true,
        secure: true,
        logLevel: 'warn'
      }
    }
  } : {},
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules']
  }
});