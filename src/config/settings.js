/**
 * Configuration management module
 * Handles API settings, environment variables, and config file loading
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Default configuration
const DEFAULT_CONFIG = {
  BIN_URL: 'https://api.jsonbin.io/v3/b/685483278a456b7966b15571',
  HEADERS: {
    'Content-Type': 'application/json',
    'X-Master-Key': '$2a$10$565nuvZV/Ei9YWxi8ccHeOlOdGnL8XpJMbFGn.ufl.I3QDw.cplBW'
  },
  TIMEOUT: 15000 // 15 seconds
};

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
 * Get effective configuration
 * Priority: Environment variables > Config file > Default values
 * @returns {Object} Effective configuration object
 */
function getConfig() {
  // Start with defaults
  const config = { ...DEFAULT_CONFIG };
  
  // Override with config file if exists
  const fileConfig = loadConfigFromFile();
  if (fileConfig) {
    Object.assign(config, fileConfig);
  }
  
  // Override with environment variables if set
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
  updateConfig,
  saveConfigToFile,
  loadConfigFromFile,
  DEFAULT_CONFIG
};

