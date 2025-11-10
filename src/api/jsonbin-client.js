/**
 * JSONBin API Client
 * Handles all interactions with the JSONBin.io API
 */

const axios = require('axios');
const { getConfig } = require('../config/settings');

/**
 * Fetch JSON data from JSONBin API
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {Error} If request fails
 */
async function fetchJson() {
  const config = getConfig();
  
  try {
    const response = await axios.get(config.BIN_URL, {
      headers: config.HEADERS,
      timeout: config.TIMEOUT
    });
    
    if (response.status === 200) {
      return response.data.record || response.data;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      throw new Error(`HTTP ${status}: ${message}`);
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Network error: No response from server');
    } else {
      // Error setting up request
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

/**
 * Upload JSON data to JSONBin API
 * @param {Object} data - JSON data to upload
 * @returns {Promise<Object>} Response from API
 * @throws {Error} If upload fails
 */
async function uploadJson(data) {
  const config = getConfig();
  
  try {
    const response = await axios.put(config.BIN_URL, data, {
      headers: config.HEADERS,
      timeout: config.TIMEOUT
    });
    
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText || 
                     (typeof error.response.data === 'string' ? error.response.data.substring(0, 300) : 'Unknown error');
      throw new Error(`HTTP ${status}: ${message}`);
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Network error: No response from server');
    } else {
      // Error setting up request
      throw new Error(`Upload error: ${error.message}`);
    }
  }
}

module.exports = {
  fetchJson,
  uploadJson
};

