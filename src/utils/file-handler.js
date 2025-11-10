/**
 * File Handler Utilities
 * Handles file operations for JSON files
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Read and parse JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {Error} If file cannot be read or parsed
 */
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    } else {
      throw new Error(`Error reading file: ${error.message}`);
    }
  }
}

/**
 * Write JSON data to file
 * @param {string} filePath - Path to output file
 * @param {Object} data - JSON data to write
 * @param {number} indent - Number of spaces for indentation (default: 2)
 * @returns {Promise<void>}
 * @throws {Error} If file cannot be written
 */
async function writeJsonFile(filePath, data, indent = 2) {
  try {
    const content = JSON.stringify(data, null, indent);
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Error writing file: ${error.message}`);
  }
}

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} Parsed JSON object if valid
 * @throws {Error} If JSON is invalid
 */
function validateJson(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

/**
 * Format JSON string with indentation
 * @param {Object|string} data - JSON object or string
 * @param {number} indent - Number of spaces for indentation (default: 4)
 * @returns {string} Formatted JSON string
 */
function formatJson(data, indent = 4) {
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data;
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    throw new Error(`Error formatting JSON: ${error.message}`);
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
  validateJson,
  formatJson
};

