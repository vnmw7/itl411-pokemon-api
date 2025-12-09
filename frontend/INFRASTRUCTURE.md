# Frontend Infrastructure Documentation

## Overview

This document describes the frontend infrastructure setup for the ITL411 Pokémon API project, including environment configuration, proxy setup, and development workflow.

## File Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── sections/           # Component sections
│   ├── services/
│   │   ├── pokemonService.js    # Existing API service
│   │   └── healthService.js    # NEW: Health check service
│   ├── utils/             # Utility functions
│   ├── config.js          # Environment-aware configuration
│   ├── main.js            # Application entry point
│   └── style.css          # Global styles
├── tests/
│   ├── config.test.js     # Configuration tests
│   ├── basic.test.js      # Basic test setup
│   └── pokemon-grid.test.js # Component tests
├── .env.example           # Environment template
├── .env                   # Development environment
├── .env.production        # Production environment
├── vite.config.js         # Enhanced Vite configuration
├── package.json           # Dependencies and scripts
└── INFRASTRUCTURE.md      # This documentation
```

## Environment Configuration

### Development Environment

The development environment uses Vite's proxy to forward API requests to the backend, avoiding CORS issues:

- **API Base URL**: `/api/v1` (proxied to backend)
- **Backend Target**: `https://lionfish-app-ff29q.ondigitalocean.app`
- **Environment Variables**: Loaded from `.env` file

### Production Environment

Production environment connects directly to the backend:

- **API Base URL**: `https://lionfish-app-ff29q.ondigitalocean.app/api/v1`
- **Environment Variables**: Loaded from `.env.production` file

## Environment Variables

### Development (.env)

```bash
# API Configuration
VITE_API_BASE_URL=/api/v1

# Development Settings
VITE_NODE_ENV=development
VITE_DEBUG=true

# Feature Flags
VITE_ENABLE_EVOLUTION_CHAIN=true
VITE_ENABLE_RECOMMENDATIONS=true
VITE_ENABLE_TYPE_FILTERING=true

# Configuration
VITE_DEBOUNCE_MS=300
VITE_DEFAULT_LIMIT=50
VITE_GRID_MIN_WIDTH=140
```

### Production (.env.production)

```bash
# API Configuration
VITE_API_BASE_URL=https://lionfish-app-ff29q.ondigitalocean.app/api/v1

# Production Settings
VITE_NODE_ENV=production
VITE_DEBUG=false
```

## Vite Configuration

The `vite.config.js` provides:

### Development Features
- **API Proxy**: Forwards `/api/*` requests to backend
- **Health Proxy**: Forwards `/health` requests to backend
- **Error Handling**: Provides user-friendly error messages
- **Debug Logging**: Enhanced debugging for development

### Testing Features
- **jsdom Environment**: DOM testing support
- **Global Test APIs**: Access to test globals
- **Test File Pattern**: Automatically finds `*.test.js` files

## Services

### Health Service (`src/services/healthService.js`)

Provides backend availability checking:

```javascript
import { healthService } from './services/healthService.js';

// Check if backend is reachable
const isReachable = await healthService.isBackendReachable();

// Get detailed backend status
const status = await healthService.getBackendStatus();
```

### Configuration (`src/config.js`)

Environment-aware configuration with backward compatibility:

```javascript
import { API_BASE_URL, CONFIG, ENV_INFO } from './config.js';

// Current environment info
console.log(ENV_INFO.isDev); // true/false
console.log(ENV_INFO.apiBaseUrl); // Current API URL

// Configuration values
console.log(CONFIG.DEBOUNCE_MS); // 300
console.log(CONFIG.DEFAULT_LIMIT); // 50
```

## Development Workflow

### 1. Setup

```bash
# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Development

- Frontend runs on `http://localhost:5174`
- API requests are proxied to backend
- Hot reload enabled for fast development
- Environment variables loaded from `.env`

### 3. Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### 4. Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Proxy Configuration

The development proxy handles:

### API Routes (`/api/*`)
- **Target**: `https://lionfish-app-ff29q.ondigitalocean.app`
- **Change Origin**: Enables CORS
- **SSL Verification**: Maintains security
- **Path Rewriting**: Preserves original request paths
- **Error Handling**: User-friendly error responses

### Health Route (`/health`)
- **Target**: Same backend as API
- **Log Level**: Warnings only
- **Purpose**: Backend health monitoring

## Error Handling

### Proxy Errors
- **502 Status**: Backend unavailable
- **JSON Response**: Structured error information
- **Console Logging**: Detailed error context

### Health Service Errors
- **Timeout Handling**: 5-second timeout for health checks
- **Graceful Degradation**: Continues operation if health check fails
- **User Feedback**: Console warnings for debugging

## Testing Infrastructure

### Test Configuration
- **Environment**: jsdom for DOM testing
- **Globals**: Vitest globals available
- **File Pattern**: `tests/**/*.test.js`
- **Exclusions**: `node_modules` directory

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service integration testing
- **Configuration Tests**: Environment and config validation

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure proxy is configured correctly
2. **Environment Variables**: Check `.env` file exists and is formatted correctly
3. **Backend Connection**: Verify backend is accessible at target URL
4. **Test Failures**: Check import paths and test structure

### Debug Commands

```bash
# Check environment variables
echo $VITE_API_BASE_URL

# Verify proxy configuration
npm run dev -- --debug

# Run tests with verbose output
npm test -- --verbose
```

## Best Practices

1. **Environment Management**: Use `.env.example` as template for new environments
2. **Secret Management**: Never commit `.env` files with sensitive data
3. **Proxy Usage**: Always use proxy in development to avoid CORS
4. **Health Monitoring**: Implement health checks before critical operations
5. **Testing**: Write tests for new configuration options

## Migration Guide

### From Old Configuration

1. Update imports to use new `config.js` structure
2. Replace direct API calls with `PokemonService`
3. Add health checks before API operations
4. Update environment variables to use `VITE_` prefix

### New Features

1. **Environment Detection**: Automatic development/production detection
2. **Health Monitoring**: Backend availability checking
3. **Enhanced Error Handling**: Better user experience
4. **Testing Support**: Comprehensive test infrastructure