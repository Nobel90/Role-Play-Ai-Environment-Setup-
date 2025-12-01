/**
 * Configuration management module
 * Handles API settings, environment variables, and config file loading
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Environment configurations
const ENVIRONMENTS = {
  production: {
    name: 'Production',
    BIN_URL: 'https://api.jsonbin.io/v3/b/685483278a456b7966b15571',
    HEADERS: {
      'Content-Type': 'application/json',
      'X-Master-Key': '$2a$10$565nuvZV/Ei9YWxi8ccHeOlOdGnL8XpJMbFGn.ufl.I3QDw.cplBW'
    },
    TIMEOUT: 15000 // 15 seconds
  },
  staging: {
    name: 'Staging',
    BIN_URL: 'https://api.jsonbin.io/v3/b/692c7278ae596e708f7a7f69',
    HEADERS: {
      'Content-Type': 'application/json',
      'X-Master-Key': '$2a$10$565nuvZV/Ei9YWxi8ccHeOlOdGnL8XpJMbFGn.ufl.I3QDw.cplBW'
    },
    TIMEOUT: 15000 // 15 seconds
  }
};

// Default environment (always defaults to production on startup)
const DEFAULT_ENVIRONMENT = 'production';

// Current environment (session-only, resets to production on module load)
let currentEnvironment = DEFAULT_ENVIRONMENT;

// Default configuration (for backward compatibility)
const DEFAULT_CONFIG = ENVIRONMENTS[DEFAULT_ENVIRONMENT];

/**
 * Get configuration directory path
 * @returns {string} Path to user data directory
 */
function getConfigDir() {
  return app ? app.getPath('userData') : path.join(process.cwd(), 'config');
}

/**
 * Get config file path
 * @returns {string} Path to config.json file
 */
function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Load configuration from file
 * @returns {Object} Configuration object
 */
function loadConfigFromFile() {
  const configPath = getConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error loading config file:', error);
  }
  
  return null;
}

/**
 * Save configuration to file
 * @param {Object} config - Configuration object to save
 */
function saveConfigToFile(config) {
  const configDir = getConfigDir();
  const configPath = getConfigPath();
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving config file:', error);
    throw error;
  }
}

/**
 * Get current environment name
 * Always defaults to production (does not persist across restarts)
 * @returns {string} Current environment name ('production' or 'staging')
 */
function getCurrentEnvironment() {
  return currentEnvironment;
}

/**
 * Get available environments
 * @returns {Array} Array of environment objects with id and name
 */
function getEnvironments() {
  return Object.keys(ENVIRONMENTS).map(id => ({
    id,
    name: ENVIRONMENTS[id].name
  }));
}

/**
 * Set current environment (session-only, does not persist)
 * @param {string} envName - Environment name ('production' or 'staging')
 * @returns {Object} Configuration for the selected environment
 */
function setCurrentEnvironment(envName) {
  if (!ENVIRONMENTS[envName]) {
    throw new Error(`Invalid environment: ${envName}`);
  }
  // Update session-only current environment
  // Note: This does not persist to file - always defaults to production on startup
  currentEnvironment = envName;
  return ENVIRONMENTS[envName];
}

/**
 * Get effective configuration for current environment
 * Priority: Environment variables > Config file > Environment defaults
 * @param {string} envName - Optional environment name, defaults to current environment
 * @returns {Object} Effective configuration object
 */
function getConfig(envName = null) {
  // Use provided environment or current session environment (defaults to production)
  const currentEnv = envName || currentEnvironment;
  const envConfig = ENVIRONMENTS[currentEnv] || ENVIRONMENTS[DEFAULT_ENVIRONMENT];
  
  // Start with environment defaults
  const config = { ...envConfig };
  
  // Override with config file if exists
  const fileConfig = loadConfigFromFile();
  if (fileConfig) {
    // Only override if file config doesn't specify a different environment's bin
    // For now, we'll merge file config but prioritize environment-specific settings
    Object.assign(config, fileConfig);
  }
  
  // Override with environment variables if set (highest priority)
  if (process.env.JSONBIN_URL) {
    config.BIN_URL = process.env.JSONBIN_URL;
  }
  
  if (process.env.JSONBIN_MASTER_KEY) {
    config.HEADERS = {
      ...config.HEADERS,
      'X-Master-Key': process.env.JSONBIN_MASTER_KEY
    };
  }
  
  if (process.env.API_TIMEOUT) {
    config.TIMEOUT = parseInt(process.env.API_TIMEOUT, 10);
  }
  
  return config;
}

/**
 * Update configuration
 * @param {Object} updates - Configuration updates
 */
function updateConfig(updates) {
  const currentConfig = getConfig();
  const newConfig = { ...currentConfig, ...updates };
  saveConfigToFile(newConfig);
  return newConfig;
}

module.exports = {
  getConfig,
  getCurrentEnvironment,
  getEnvironments,
  setCurrentEnvironment,
  updateConfig,
  saveConfigToFile,
  loadConfigFromFile,
  DEFAULT_CONFIG,
  ENVIRONMENTS
};

