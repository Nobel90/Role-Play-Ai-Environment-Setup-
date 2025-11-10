/**
 * Renderer Process Logic
 * Handles UI interactions and communication with main process
 */

/**
 * Format JSON with indentation
 * @param {Object|string} data - JSON object or string
 * @param {number} indent - Number of spaces for indentation
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

// DOM Elements
const jsonTextArea = document.getElementById('jsonTextArea');
const reloadBtn = document.getElementById('reloadBtn');
const loadFileBtn = document.getElementById('loadFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const uploadBtn = document.getElementById('uploadBtn');
const statusMessage = document.getElementById('statusMessage');

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success' or 'error'
 */
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}

/**
 * Format and display JSON in text area
 * @param {Object} data - JSON data to display
 */
function displayJson(data) {
  try {
    const formatted = formatJson(data, 4);
    jsonTextArea.value = formatted;
  } catch (error) {
    showStatus(`Error formatting JSON: ${error.message}`, 'error');
  }
}

/**
 * Handle fetch JSON from API
 */
async function handleFetchJson() {
  try {
    reloadBtn.disabled = true;
    reloadBtn.textContent = 'Loading...';
    
    const result = await window.electronAPI.fetchJson();
    
    if (result.success) {
      displayJson(result.data);
      showStatus('✅ JSON loaded successfully');
    } else {
      showStatus(`❌ Fetch failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    reloadBtn.disabled = false;
    reloadBtn.textContent = 'Reload JSON';
  }
}

/**
 * Handle upload JSON to API
 */
async function handleUploadJson() {
  const jsonString = jsonTextArea.value.trim();
  
  if (!jsonString) {
    showStatus('⚠️ Please paste or load JSON first.', 'error');
    return;
  }
  
  // Validate JSON before uploading
  try {
    JSON.parse(jsonString);
  } catch (error) {
    showStatus(`❌ Invalid JSON: ${error.message}`, 'error');
    return;
  }
  
  try {
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    
    const result = await window.electronAPI.uploadJson(jsonString);
    
    if (result.success) {
      showStatus('✅ JSONBin updated successfully');
    } else {
      showStatus(`❌ Upload failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = '⬆ Upload to JSONBin';
  }
}

/**
 * Handle load JSON from file
 */
async function handleLoadFromFile() {
  try {
    loadFileBtn.disabled = true;
    loadFileBtn.textContent = 'Loading...';
    
    const result = await window.electronAPI.loadFromFile();
    
    if (result.canceled) {
      // User canceled file dialog
      return;
    }
    
    if (result.success) {
      displayJson(result.data);
      showStatus('✅ File loaded successfully');
    } else {
      showStatus(`❌ Load failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    loadFileBtn.disabled = false;
    loadFileBtn.textContent = '📂 Load from File';
  }
}

/**
 * Handle save JSON to file
 */
async function handleSaveToFile() {
  const jsonString = jsonTextArea.value.trim();
  
  if (!jsonString) {
    showStatus('⚠️ Please paste or load JSON first.', 'error');
    return;
  }
  
  // Validate JSON before saving
  try {
    JSON.parse(jsonString);
  } catch (error) {
    showStatus(`❌ Invalid JSON: ${error.message}`, 'error');
    return;
  }
  
  try {
    saveFileBtn.disabled = true;
    saveFileBtn.textContent = 'Saving...';
    
    const result = await window.electronAPI.saveToFile(jsonString);
    
    if (result.canceled) {
      // User canceled file dialog
      return;
    }
    
    if (result.success) {
      showStatus(`✅ File saved successfully`);
    } else {
      showStatus(`❌ Save failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
  } finally {
    saveFileBtn.disabled = false;
    saveFileBtn.textContent = '💾 Save to File';
  }
}

// Event Listeners
reloadBtn.addEventListener('click', handleFetchJson);
uploadBtn.addEventListener('click', handleUploadJson);
loadFileBtn.addEventListener('click', handleLoadFromFile);
saveFileBtn.addEventListener('click', handleSaveToFile);

// Load JSON on startup
window.addEventListener('DOMContentLoaded', () => {
  handleFetchJson();
});

// Listen for errors from main process
window.electronAPI.onError((error) => {
  showStatus(`❌ Error: ${error}`, 'error');
});

// Listen for success messages from main process
window.electronAPI.onSuccess((message) => {
  showStatus(message, 'success');
});

