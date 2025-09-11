/**
 * Configuration for API endpoints
 * 
 * This file centralizes API configuration to make it easily modifiable
 * Change the SERVER_PORT if needed (e.g., use 5001 on macOS if port 5000 is reserved)
 */

// Use relative API path so Nginx in the client container proxies to the server
export const API_URL = '/api';
