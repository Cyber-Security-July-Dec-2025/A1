/**
 * Server configuration settings
 * 
 * This file centralizes server configuration to make it easily modifiable
 * Change the SERVER_PORT if needed (e.g., use 5001 on macOS if port 5000 is reserved)
 */

// Server port configuration
const SERVER_PORT = 5000; // Internal container port must stay 5000

module.exports = {
  SERVER_PORT
};
