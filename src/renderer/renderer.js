/**
 * Renderer Process Logic
 * Handles UI interactions and communication with main process
 */

/**
 * Environment dropdown options mapping
 * Maps display names to JSON values for UE5
 */
const ENVIRONMENT_OPTIONS = [
  { display: 'Hospital - Betty', value: 'BDS_Hospital' },
  { display: 'Hospital - Joshua', value: 'BDS_Hospital_Male' },
  { display: 'Hospital - David', value: 'BDS_Hospital_Male_David' },
  { display: 'Hospital - Rachael', value: 'BDS_Hospital_Rachael' }
];

/**
 * Get environment display name from value
 * @param {string} value - Environment value (e.g., "BDS_Hospital")
 * @returns {string} Display name or value if not found
 */
function getEnvironmentDisplayName(value) {
  if (!value) return 'Not specified';
  const option = ENVIRONMENT_OPTIONS.find(opt => opt.value === value);
  return option ? option.display : value;
}

/**
 * Get environment value from display name
 * @param {string} displayName - Environment display name (e.g., "Hospital - Betty")
 * @returns {string} Environment value or displayName if not found
 */
function getEnvironmentValue(displayName) {
  if (!displayName) return '';
  const option = ENVIRONMENT_OPTIONS.find(opt => opt.display === displayName);
  return option ? option.value : displayName;
}

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

// View Mode Elements
const viewModeBtn = document.getElementById('viewModeBtn');
const visualMode = document.getElementById('visualMode');
const jsonMode = document.getElementById('jsonMode');
const scenariosList = document.getElementById('scenariosList');
const addScenarioBtn = document.getElementById('addScenarioBtn');

// Modal Elements
const scenarioModal = document.getElementById('scenarioModal');
const modalTitle = document.getElementById('modalTitle');
const scenarioForm = document.getElementById('scenarioForm');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelScenarioBtn = document.getElementById('cancelScenarioBtn');
const saveScenarioBtn = document.getElementById('saveScenarioBtn');

// State
let currentViewMode = 'json'; // 'json' or 'visual'
let currentJsonData = null;
let editingScenarioIndex = null;

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
 * Deep clone an object to avoid reference issues
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Format and display JSON in text area
 * @param {Object} data - JSON data to display
 */
function displayJson(data) {
  try {
    // Store a deep clone to preserve original structure
    currentJsonData = deepClone(data);
    const formatted = formatJson(data, 4);
    jsonTextArea.value = formatted;
    
    
    // Update visual mode if active
    if (currentViewMode === 'visual') {
      renderScenarios();
    }
  } catch (error) {
    showStatus(`Error formatting JSON: ${error.message}`, 'error');
  }
}

/**
 * Parse scenarios from JSON data
 * Handles different JSON structures flexibly
 * @param {Object} data - JSON data
 * @returns {Array} Array of scenarios
 */
function parseScenarios(data) {
  if (!data) return [];
  
  let scenarios = [];
  
  // If data is an array, use it directly
  if (Array.isArray(data)) {
    scenarios = data;
  }
  // If data has a 'scenarios' property
  else if (data.scenarios && Array.isArray(data.scenarios)) {
    scenarios = data.scenarios;
  }
  // If data has a 'scenario' property (singular)
  else if (data.scenario && Array.isArray(data.scenario)) {
    scenarios = data.scenario;
  }
  // Try to find any array property
  else {
    for (const key in data) {
      if (Array.isArray(data[key])) {
        scenarios = data[key];
        break;
      }
    }
  }
  
  // Normalize field names to handle variations
  return scenarios.map((scenario, index) => {
    const normalized = { ...scenario };
    
    // Normalize title - check capitalized and lowercase variations
    normalized.title = scenario.Title || scenario.title || scenario.name || '';
    
    // Normalize character ID field names - check all variations including capitalized
    normalized.characterId = scenario.CharacterID || scenario.characterId || scenario.characterID || 
                             scenario.character_id || scenario.character || scenario.characterName || '';
    
    // Normalize environment field names - check capitalized and lowercase variations
    normalized.environment = scenario.Environment || scenario.environment || scenario.env || '';
    
    // Normalize greeting field names - check capitalized and lowercase variations
    normalized.greeting = scenario.Greeting || scenario.greeting || scenario.greetingMessage || '';
    
    // Normalize column/row/buttonIndex field names - check capitalized versions first
    normalized.column = scenario.Column !== undefined ? scenario.Column : 
                       (scenario.column !== undefined ? scenario.column : undefined);
    normalized.row = scenario.Row !== undefined ? scenario.Row : 
                    (scenario.row !== undefined ? scenario.row : undefined);
    normalized.buttonIndex = scenario.ButtonIndex !== undefined ? scenario.ButtonIndex : 
                            (scenario.buttonIndex !== undefined ? scenario.buttonIndex : 
                            (scenario.button_index !== undefined ? scenario.button_index : undefined));
    
    // Ensure ID exists
    if (!normalized.id) {
      normalized.id = scenario.ID || scenario.Id || `scenario-${index}`;
    }
    
    return normalized;
  });
}

/**
 * Get the JSON structure wrapper
 * @param {Array} scenarios - Array of scenarios
 * @returns {Object} JSON structure
 */
function buildJsonStructure(scenarios) {
  // Try to preserve original structure if it exists
  if (currentJsonData) {
    // If original had 'scenarios' property
    if (currentJsonData.scenarios !== undefined) {
      return { ...currentJsonData, scenarios };
    }
    // If original was an array
    if (Array.isArray(currentJsonData)) {
      return scenarios;
    }
  }
  
  // Default: use 'scenarios' property
  return { scenarios };
}

/**
 * Check for missing required fields in scenarios
 * @param {Array} scenarios - Array of scenarios (should be normalized)
 * @returns {Array} Array of scenarios with missing fields
 */
function checkMissingFields(scenarios) {
  const scenariosWithMissingFields = [];
  
  scenarios.forEach((scenario, index) => {
    const missingFields = [];
    
    // Check for required fields using normalized field names
    // parseScenarios() normalizes fields, so we check the normalized names
    // Check if title exists and is not empty
    const title = scenario.title || scenario.name;
    if (!title || (typeof title === 'string' && title.trim() === '')) {
      missingFields.push('Title');
    }
    
    // After normalization, characterId should be set - check if exists and not empty
    const characterId = scenario.characterId;
    if (!characterId || (typeof characterId === 'string' && characterId.trim() === '')) {
      missingFields.push('Character ID');
    }
    
    // After normalization, environment should be set - check if exists and not empty
    const environment = scenario.environment;
    if (!environment || (typeof environment === 'string' && environment.trim() === '')) {
      missingFields.push('Environment');
    }
    
    // After normalization, greeting should be set - check if exists and not empty
    const greeting = scenario.greeting;
    if (!greeting || (typeof greeting === 'string' && greeting.trim() === '')) {
      missingFields.push('Greeting');
    }
    
    if (missingFields.length > 0) {
      scenariosWithMissingFields.push({
        index,
        scenario,
        missingFields
      });
    }
  });
  
  return scenariosWithMissingFields;
}

/**
 * Render scenarios in visual mode
 */
function renderScenarios() {
  if (!currentJsonData) {
    scenariosList.innerHTML = '<div class="empty-state"><h3>No data loaded</h3><p>Click "Reload JSON" to fetch scenarios</p></div>';
    return;
  }
  
  const scenarios = parseScenarios(currentJsonData);
  
  if (scenarios.length === 0) {
    scenariosList.innerHTML = '<div class="empty-state"><h3>No scenarios found</h3><p>Click "Add Scenario" to create your first scenario</p></div>';
    return;
  }
  
  // Check for missing fields and prompt user
  const scenariosWithMissingFields = checkMissingFields(scenarios);
  if (scenariosWithMissingFields.length > 0) {
    const missingCount = scenariosWithMissingFields.length;
    const fieldsList = [...new Set(scenariosWithMissingFields.flatMap(s => s.missingFields))].join(', ');
    showStatus(`⚠️ ${missingCount} scenario(s) have missing required fields (${fieldsList}). Please edit them to fill in the missing information.`, 'error');
  }
  
  scenariosList.innerHTML = scenarios.map((scenario, index) => {
    // Use normalized field names (parseScenarios already normalized them)
    const title = scenario.title || scenario.name || 'Untitled Scenario';
    const characterId = scenario.characterId || 'Unknown';
    const environmentValue = scenario.environment || '';
    const environment = getEnvironmentDisplayName(environmentValue);
    const greeting = scenario.greeting || '';
    const id = scenario.id || `scenario-${index}`;
    
    return `
      <div class="scenario-card" data-index="${index}">
        <div class="scenario-card-header">
          <div>
            <h3 class="scenario-card-title">${escapeHtml(title)}</h3>
            <p class="scenario-card-character">Character ID: ${escapeHtml(characterId)}</p>
          </div>
          <div class="scenario-card-actions">
            <button class="btn btn-secondary btn-icon" onclick="editScenario(${index})">✏️ Edit</button>
            <button class="btn btn-danger btn-icon" onclick="deleteScenario(${index})">🗑️ Delete</button>
          </div>
        </div>
        <div class="scenario-card-body">
          <p class="scenario-card-info"><strong>Environment:</strong> ${escapeHtml(environment)}</p>
          ${greeting ? `<p class="scenario-card-info"><strong>Greeting:</strong> ${escapeHtml(greeting)}</p>` : '<p class="scenario-card-info"><em>No greeting set</em></p>'}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Toggle between JSON and Visual modes
 */
function toggleViewMode() {
  if (currentViewMode === 'json') {
    // Switch to visual mode
    currentViewMode = 'visual';
    jsonMode.classList.add('hidden');
    visualMode.classList.remove('hidden');
    viewModeBtn.textContent = '📝 JSON Mode';
    renderScenarios();
  } else {
    // Switch to JSON mode
    currentViewMode = 'json';
    visualMode.classList.add('hidden');
    jsonMode.classList.remove('hidden');
    viewModeBtn.textContent = '📋 Visual Mode';
  }
}

/**
 * Open modal to add/edit scenario
 * @param {number|null} index - Index of scenario to edit, or null for new scenario
 */
function openScenarioModal(index = null) {
  editingScenarioIndex = index;
  
  if (index !== null) {
    // Edit mode
    const scenarios = parseScenarios(currentJsonData);
    const scenario = scenarios[index];
    modalTitle.textContent = 'Edit Scenario';
    
    // Populate form fields - use normalized fields (parseScenarios already normalized them)
    document.getElementById('scenarioTitle').value = scenario.title || scenario.name || '';
    
    // Character ID - use normalized field
    const characterId = scenario.characterId || '';
    document.getElementById('scenarioCharacterId').value = characterId;
    
    // Environment - convert value to display name for dropdown
    const environmentValue = scenario.environment || '';
    const environmentDisplay = getEnvironmentDisplayName(environmentValue);
    document.getElementById('scenarioEnvironment').value = environmentDisplay;
    
    // Greeting - use normalized field
    const greeting = scenario.greeting || '';
    document.getElementById('scenarioGreeting').value = greeting;
    
    // Check for missing required fields and show warning
    const missingFields = [];
    if (!scenario.title && !scenario.name) missingFields.push('Title');
    if (!characterId) missingFields.push('Character ID');
    if (!environmentValue) missingFields.push('Environment');
    if (!greeting) missingFields.push('Greeting');
    
    if (missingFields.length > 0) {
      showStatus(`⚠️ Missing required fields: ${missingFields.join(', ')}. Please fill them in.`, 'error');
    }
  } else {
    // Add mode
    modalTitle.textContent = 'Add Scenario';
    scenarioForm.reset();
  }
  
  scenarioModal.classList.remove('hidden');
}

/**
 * Close scenario modal
 */
function closeScenarioModal() {
  scenarioModal.classList.add('hidden');
  editingScenarioIndex = null;
  scenarioForm.reset();
}

/**
 * Save scenario (add or update)
 * Preserves original field name capitalization
 */
function saveScenario() {
  const title = document.getElementById('scenarioTitle').value.trim();
  const characterId = document.getElementById('scenarioCharacterId').value.trim();
  const environmentDisplay = document.getElementById('scenarioEnvironment').value.trim();
  const greeting = document.getElementById('scenarioGreeting').value.trim();
  
  // Validation
  if (!title || !characterId || !environmentDisplay || !greeting) {
    showStatus('⚠️ Please fill in all required fields (Title, Character ID, Environment, Greeting)', 'error');
    return;
  }
  
  // Convert environment display name to value
  const environment = getEnvironmentValue(environmentDisplay);
  
  // Get original scenarios (before normalization) to preserve field names
  // We need to work with the original structure, not the normalized one
  // Create a deep clone to avoid modifying the original
  let originalScenarios = [];
  let isArrayStructure = false;
  
  if (Array.isArray(currentJsonData)) {
    originalScenarios = deepClone(currentJsonData); // Deep copy to avoid reference issues
    isArrayStructure = true;
  } else if (currentJsonData && currentJsonData.scenarios) {
    originalScenarios = deepClone(currentJsonData.scenarios); // Deep copy
  }
  
  // Clean up any normalized fields that might have been added during parsing
  originalScenarios = originalScenarios.map(scenario => {
    // Check if this scenario uses capitalized fields
    const useCapitalized = scenario.Title !== undefined || scenario.CharacterID !== undefined;
    
    if (useCapitalized) {
      // Only keep capitalized fields - remove any lowercase normalized fields
      const clean = {};
      if (scenario.Column !== undefined) clean.Column = scenario.Column;
      if (scenario.Row !== undefined) clean.Row = scenario.Row;
      if (scenario.Title !== undefined) clean.Title = scenario.Title;
      if (scenario.CharacterID !== undefined) clean.CharacterID = scenario.CharacterID;
      if (scenario.ButtonIndex !== undefined) clean.ButtonIndex = scenario.ButtonIndex;
      if (scenario.Environment !== undefined) clean.Environment = scenario.Environment;
      if (scenario.Greeting !== undefined) clean.Greeting = scenario.Greeting;
      return clean;
    } else {
      // Keep lowercase fields - remove any normalized fields that were added
      const clean = {};
      Object.keys(scenario).forEach(key => {
        // Skip normalized fields that might have been added (only if they're duplicates)
        // Keep original lowercase fields
        if (!(key === 'title' && scenario.Title) &&
            !(key === 'characterId' && scenario.CharacterID) &&
            !(key === 'environment' && scenario.Environment) &&
            !(key === 'greeting' && scenario.Greeting) &&
            !(key === 'column' && scenario.Column !== undefined) &&
            !(key === 'row' && scenario.Row !== undefined) &&
            !(key === 'buttonIndex' && scenario.ButtonIndex !== undefined)) {
          clean[key] = scenario[key];
        }
      });
      return clean;
    }
  });
  
  if (editingScenarioIndex !== null) {
    // Update existing scenario - preserve original field name capitalization
    const originalScenario = originalScenarios[editingScenarioIndex];
    
    if (!originalScenario) {
      showStatus('❌ Error: Scenario not found', 'error');
      return;
    }
    
    // Determine which field names to use (preserve original capitalization if it exists)
    const useCapitalized = originalScenario.Title !== undefined || originalScenario.CharacterID !== undefined;
    
    if (useCapitalized) {
      // Update using capitalized field names - create new object without normalized fields
      const updatedScenario = {
        Column: originalScenario.Column !== undefined ? originalScenario.Column : 0,
        Row: originalScenario.Row !== undefined ? originalScenario.Row : 0,
        Title: title,
        CharacterID: characterId,
        ButtonIndex: originalScenario.ButtonIndex !== undefined ? originalScenario.ButtonIndex : 0,
        Environment: environment,
        Greeting: greeting
      };
      originalScenarios[editingScenarioIndex] = updatedScenario;
    } else {
      // Use lowercase field names
      const updatedScenario = {
        ...originalScenario,
        title,
        characterId,
        environment,
        greeting
      };
      // Preserve column/row/buttonIndex if they exist
      if (originalScenario.column !== undefined) updatedScenario.column = originalScenario.column;
      if (originalScenario.row !== undefined) updatedScenario.row = originalScenario.row;
      if (originalScenario.buttonIndex !== undefined) updatedScenario.buttonIndex = originalScenario.buttonIndex;
      originalScenarios[editingScenarioIndex] = updatedScenario;
    }
  } else {
    // Add new scenario - use capitalized field names to match existing structure
    const newIndex = originalScenarios.length;
    const useCapitalized = originalScenarios.length > 0 && 
                          (originalScenarios[0].Title !== undefined || originalScenarios[0].CharacterID !== undefined);
    
    if (useCapitalized) {
      originalScenarios.push({
        Column: newIndex % 2,
        Row: Math.floor(newIndex / 2),
        Title: title,
        CharacterID: characterId,
        ButtonIndex: newIndex,
        Environment: environment,
        Greeting: greeting
      });
    } else {
      originalScenarios.push({
        id: `scenario-${Date.now()}`,
        title,
        characterId,
        environment,
        greeting,
        column: newIndex % 2,
        row: Math.floor(newIndex / 2),
        buttonIndex: newIndex
      });
    }
  }
  
  // Rebuild JSON structure using original scenarios (not normalized)
  const newJsonData = isArrayStructure ? originalScenarios : { scenarios: originalScenarios };
  currentJsonData = newJsonData;
  
  // Update JSON textarea
  displayJson(newJsonData);
  
  closeScenarioModal();
  showStatus(editingScenarioIndex !== null ? '✅ Scenario updated' : '✅ Scenario added');
}

/**
 * Edit scenario
 * @param {number} index - Index of scenario to edit
 */
function editScenario(index) {
  openScenarioModal(index);
}

/**
 * Delete scenario
 * @param {number} index - Index of scenario to delete
 */
function deleteScenario(index) {
  if (!confirm('Are you sure you want to delete this scenario?')) {
    return;
  }
  
  const scenarios = parseScenarios(currentJsonData);
  scenarios.splice(index, 1);
  
  // Rebuild JSON structure
  const newJsonData = buildJsonStructure(scenarios);
  currentJsonData = newJsonData;
  
  // Update JSON textarea
  displayJson(newJsonData);
  
  showStatus('✅ Scenario deleted');
}

// Make functions globally available for onclick handlers
window.editScenario = editScenario;
window.deleteScenario = deleteScenario;

/**
 * Handle fetch JSON from API
 */
async function handleFetchJson() {
  try {
    reloadBtn.disabled = true;
    reloadBtn.textContent = 'Loading...';
    
    const result = await window.electronAPI.fetchJson();
    
    if (result.success) {
      // Handle JSONBin response structure (may have 'record' property)
      const data = result.data.record || result.data;
      displayJson(data);
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
      // Handle JSONBin response structure if present
      const data = result.data.record || result.data;
      displayJson(data);
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
viewModeBtn.addEventListener('click', toggleViewMode);
addScenarioBtn.addEventListener('click', () => openScenarioModal(null));
closeModalBtn.addEventListener('click', closeScenarioModal);
cancelScenarioBtn.addEventListener('click', closeScenarioModal);
scenarioForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveScenario();
});

// Close modal when clicking outside
scenarioModal.addEventListener('click', (e) => {
  if (e.target === scenarioModal) {
    closeScenarioModal();
  }
});

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

