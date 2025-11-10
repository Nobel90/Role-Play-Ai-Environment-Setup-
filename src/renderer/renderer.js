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
const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
const loadFileBtn = document.getElementById('loadFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const uploadBtn = document.getElementById('uploadBtn');
const statusMessage = document.getElementById('statusMessage');

// View Mode Elements
const viewModeBtn = document.getElementById('viewModeBtn');
const visualMode = document.getElementById('visualMode');
const jsonMode = document.getElementById('jsonMode');
const scenariosList = document.getElementById('scenariosList');
const scenariosGrid = document.getElementById('scenariosGrid');
const addScenarioBtn = document.getElementById('addScenarioBtn');
const addRowBtn = document.getElementById('addRowBtn');
const addColumnBtn = document.getElementById('addColumnBtn');
const refreshGridBtn = document.getElementById('refreshGridBtn');

// Modal Elements
const scenarioModal = document.getElementById('scenarioModal');
const modalTitle = document.getElementById('modalTitle');
const scenarioForm = document.getElementById('scenarioForm');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelScenarioBtn = document.getElementById('cancelScenarioBtn');
const saveScenarioBtn = document.getElementById('saveScenarioBtn');

// State
let currentViewMode = 'visual'; // 'json' or 'visual'
let currentJsonData = null;
let editingScenarioColumn = null;
let editingScenarioRow = null;
let gridColumns = 2; // Default 2-column grid (can be increased)
let draggedCardColumn = null;
let draggedCardRow = null;
let draggedCardElement = null;
let minGridRows = 0; // Minimum number of rows to display (for empty slots)
let minGridCols = 2; // Minimum number of columns to display (for empty slots)

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
    
    // Reset and refresh grid when loading new data
    refreshGridInternal();
    
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
 * Calculate grid dimensions based on scenarios
 * @param {Array} scenarios - Array of scenarios
 * @returns {Object} Grid dimensions {maxRow, maxCol, totalSlots}
 */
function calculateGridDimensions(scenarios) {
  let maxRow = -1;
  let maxCol = -1;
  
  scenarios.forEach(scenario => {
    const row = scenario.row !== undefined ? scenario.row : 0;
    const col = scenario.column !== undefined ? scenario.column : 0;
    if (row > maxRow) maxRow = row;
    if (col > maxCol) maxCol = col;
  });
  
  // Ensure at least 1 row and 1 column
  maxRow = Math.max(maxRow, 0);
  maxCol = Math.max(maxCol, 0);
  
  // Use the maximum of calculated columns, minimum columns, and gridColumns
  const calculatedCols = Math.max(maxCol + 1, minGridCols);
  const actualColumns = Math.max(calculatedCols, gridColumns);
  
  // Calculate total slots needed
  const calculatedSlots = (maxRow + 1) * actualColumns;
  const totalSlots = Math.max(scenarios.length, calculatedSlots);
  
  return { maxRow, maxCol, totalSlots, actualColumns };
}

/**
 * Get scenario at grid position
 * @param {Array} scenarios - Array of scenarios
 * @param {number} column - Column index
 * @param {number} row - Row index
 * @returns {Object|null} Scenario at position or null
 */
function getScenarioAtPosition(scenarios, column, row) {
  return scenarios.find(s => {
    const sCol = s.column !== undefined ? s.column : 0;
    const sRow = s.row !== undefined ? s.row : 0;
    return sCol === column && sRow === row;
  }) || null;
}

/**
 * Find the first empty slot in the grid
 * @param {Array} scenarios - Array of scenarios
 * @param {number} totalRows - Total number of rows
 * @param {number} totalCols - Total number of columns
 * @returns {Object|null} {column, row} of first empty slot, or null if none found
 */
function findFirstEmptySlot(scenarios, totalRows, totalCols) {
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      if (!getScenarioAtPosition(scenarios, col, row)) {
        return { column: col, row: row };
      }
    }
  }
  return null;
}

/**
 * Render scenarios in visual mode with grid slots
 */
function renderScenarios() {
  if (!currentJsonData) {
    scenariosGrid.innerHTML = '<div class="empty-state"><h3>No data loaded</h3><p>Click "Reload JSON" to fetch scenarios</p></div>';
    return;
  }
  
  const scenarios = parseScenarios(currentJsonData);
  
  // Check for missing fields and prompt user
  const scenariosWithMissingFields = checkMissingFields(scenarios);
  if (scenariosWithMissingFields.length > 0) {
    const missingCount = scenariosWithMissingFields.length;
    const fieldsList = [...new Set(scenariosWithMissingFields.flatMap(s => s.missingFields))].join(', ');
    showStatus(`⚠️ ${missingCount} scenario(s) have missing required fields (${fieldsList}). Please edit them to fill in the missing information.`, 'error');
  }
  
  // Calculate grid dimensions
  const { maxRow, totalSlots, actualColumns } = calculateGridDimensions(scenarios);
  // Use minimum rows if it's greater than calculated rows
  const calculatedRows = Math.max(maxRow + 1, Math.ceil(totalSlots / actualColumns));
  const totalRows = Math.max(calculatedRows, minGridRows);
  const totalCols = Math.max(actualColumns, minGridCols);
  
  // Update grid columns for CSS
  scenariosGrid.style.gridTemplateColumns = `repeat(${totalCols}, 1fr)`;
  
  // Create grid slots
  let gridHTML = '';
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      const scenario = getScenarioAtPosition(scenarios, col, row);
      const slotIndex = row * totalCols + col;
      
      if (scenario) {
        // Slot with scenario card
        // Use grid position to identify scenario uniquely instead of array index
        const title = scenario.title || scenario.name || 'Untitled Scenario';
        const characterId = scenario.characterId || 'Unknown';
        const environmentValue = scenario.environment || '';
        const environment = getEnvironmentDisplayName(environmentValue);
        const greeting = scenario.greeting || '';
        
        gridHTML += `
          <div class="grid-slot" data-column="${col}" data-row="${row}" data-slot-index="${slotIndex}" 
               ondragover="event.preventDefault(); handleDragOver(event)" 
               ondrop="handleDrop(event, ${col}, ${row})" 
               ondragenter="handleDragEnter(event)" 
               ondragleave="handleDragLeave(event)">
            <div class="scenario-card" draggable="true" 
                 data-scenario-column="${col}"
                 data-scenario-row="${row}"
                 ondragstart="handleDragStart(event, ${col}, ${row})" 
                 ondragend="handleDragEnd(event)">
              <div class="scenario-card-header">
                <h3 class="scenario-card-title">${escapeHtml(title)}</h3>
                <div class="scenario-card-actions">
                  <button class="btn-card-action" onclick="duplicateScenario(${col}, ${row})" title="Duplicate scenario">Duplicate</button>
                  <button class="btn-card-action" onclick="editScenario(${col}, ${row})" title="Edit scenario">Edit</button>
                  <button class="btn-card-action btn-card-action-danger" onclick="deleteScenario(${col}, ${row})" title="Delete scenario">Delete</button>
                </div>
              </div>
              <div class="scenario-card-body">
                <p class="scenario-card-info"><strong>Character ID:</strong> ${escapeHtml(characterId)}</p>
                <p class="scenario-card-info"><strong>Environment:</strong> ${escapeHtml(environment)}</p>
                ${greeting ? `<p class="scenario-card-info"><strong>Greeting:</strong> ${escapeHtml(greeting)}</p>` : '<p class="scenario-card-info"><em>No greeting set</em></p>'}
              </div>
            </div>
          </div>
        `;
      } else {
        // Empty slot
        gridHTML += `
          <div class="grid-slot grid-slot-empty" data-column="${col}" data-row="${row}" data-slot-index="${slotIndex}"
               ondragover="event.preventDefault(); handleDragOver(event)" 
               ondrop="handleDrop(event, ${col}, ${row})" 
               ondragenter="handleDragEnter(event)" 
               ondragleave="handleDragLeave(event)">
            <div class="empty-slot-indicator">
              <span class="empty-slot-text">Empty Slot</span>
              <button class="btn-remove-slot" onclick="removeEmptySlot(${col}, ${row})" title="Remove empty slot">×</button>
            </div>
          </div>
        `;
      }
    }
  }
  
  scenariosGrid.innerHTML = gridHTML;
  
  if (scenarios.length === 0 && totalSlots === 0) {
    scenariosGrid.innerHTML = '<div class="empty-state"><h3>No scenarios found</h3><p>Click "Add Scenario" to create your first scenario</p></div>';
  }
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
    viewModeBtn.textContent = 'JSON Mode';
    renderScenarios();
  } else {
    // Switch to JSON mode
    currentViewMode = 'json';
    visualMode.classList.add('hidden');
    jsonMode.classList.remove('hidden');
    viewModeBtn.textContent = 'Visual Mode';
  }
}

/**
 * Open modal to add/edit scenario
 * @param {number|null} column - Column of scenario to edit, or null for new scenario
 * @param {number|null} row - Row of scenario to edit, or null for new scenario
 */
function openScenarioModal(column = null, row = null) {
  editingScenarioColumn = column;
  editingScenarioRow = row;
  
  if (column !== null && row !== null) {
    // Edit mode
    const scenarios = parseScenarios(currentJsonData);
    const scenario = getScenarioAtPosition(scenarios, column, row);
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
  editingScenarioColumn = null;
  editingScenarioRow = null;
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
  
  if (editingScenarioColumn !== null && editingScenarioRow !== null) {
    // Update existing scenario - preserve original field name capitalization
    // Find the original scenario by grid position
    const hasCapitalizedFields = originalScenarios.length > 0 && 
                          (originalScenarios[0].Title !== undefined || originalScenarios[0].CharacterID !== undefined);
    
    let originalScenario = null;
    let originalIndex = -1;
    if (hasCapitalizedFields) {
      originalIndex = originalScenarios.findIndex(s => {
        const sCol = s.Column !== undefined ? s.Column : 0;
        const sRow = s.Row !== undefined ? s.Row : 0;
        return sCol === editingScenarioColumn && sRow === editingScenarioRow;
      });
    } else {
      originalIndex = originalScenarios.findIndex(s => {
        const sCol = s.column !== undefined ? s.column : 0;
        const sRow = s.row !== undefined ? s.row : 0;
        return sCol === editingScenarioColumn && sRow === editingScenarioRow;
      });
    }
    
    if (originalIndex === -1) {
      showStatus('❌ Error: Scenario not found', 'error');
      return;
    }
    
    originalScenario = originalScenarios[originalIndex];
    
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
    // Add new scenario - find first empty slot or add new row
    const useCapitalized = originalScenarios.length > 0 && 
                          (originalScenarios[0].Title !== undefined || originalScenarios[0].CharacterID !== undefined);
    
    // Get current grid dimensions
    const normalizedScenarios = parseScenarios(currentJsonData);
    const { maxRow, actualColumns } = calculateGridDimensions(normalizedScenarios);
    const totalCols = Math.max(actualColumns, minGridCols);
    const totalRows = Math.max(maxRow + 1, minGridRows);
    
    // Find first empty slot
    let emptySlot = findFirstEmptySlot(normalizedScenarios, totalRows, totalCols);
    let targetColumn, targetRow;
    
    if (emptySlot) {
      // Use the first empty slot found
      targetColumn = emptySlot.column;
      targetRow = emptySlot.row;
    } else {
      // No empty slot found, add a new row
      targetRow = totalRows;
      targetColumn = 0;
      minGridRows = totalRows + 1;
    }
    
    // Calculate ButtonIndex
    const buttonIndex = targetRow * totalCols + targetColumn;
    
    if (useCapitalized) {
      originalScenarios.push({
        Column: targetColumn,
        Row: targetRow,
        Title: title,
        CharacterID: characterId,
        ButtonIndex: buttonIndex,
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
        column: targetColumn,
        row: targetRow,
        buttonIndex: buttonIndex
      });
    }
  }
  
  // Rebuild JSON structure using original scenarios (not normalized)
  const newJsonData = isArrayStructure ? originalScenarios : { scenarios: originalScenarios };
  currentJsonData = newJsonData;
  
  // Update JSON textarea
  displayJson(newJsonData);
  
  closeScenarioModal();
  showStatus(editingScenarioColumn !== null && editingScenarioRow !== null ? '✅ Scenario updated' : '✅ Scenario added');
}

/**
 * Edit scenario
 * @param {number} column - Column of scenario to edit
 * @param {number} row - Row of scenario to edit
 */
function editScenario(column, row) {
  openScenarioModal(column, row);
}

/**
 * Duplicate scenario to a new slot
 * @param {number} column - Column of scenario to duplicate
 * @param {number} row - Row of scenario to duplicate
 */
function duplicateScenario(column, row) {
  if (!currentJsonData) {
    showStatus('⚠️ Please load JSON data first', 'error');
    return;
  }
  
  // Get original scenarios to preserve structure
  let originalScenarios = [];
  let isArrayStructure = false;
  
  if (Array.isArray(currentJsonData)) {
    originalScenarios = deepClone(currentJsonData);
    isArrayStructure = true;
  } else if (currentJsonData && currentJsonData.scenarios) {
    originalScenarios = deepClone(currentJsonData.scenarios);
  }
  
  // Find the original scenario by grid position
  const useCapitalized = originalScenarios.length > 0 && 
                        (originalScenarios[0].Title !== undefined || originalScenarios[0].CharacterID !== undefined);
  
  let originalScenario = null;
  if (useCapitalized) {
    originalScenario = originalScenarios.find(s => {
      const sCol = s.Column !== undefined ? s.Column : 0;
      const sRow = s.Row !== undefined ? s.Row : 0;
      return sCol === column && sRow === row;
    });
  } else {
    originalScenario = originalScenarios.find(s => {
      const sCol = s.column !== undefined ? s.column : 0;
      const sRow = s.row !== undefined ? s.row : 0;
      return sCol === column && sRow === row;
    });
  }
  
  if (!originalScenario) {
    showStatus('❌ Error: Scenario not found', 'error');
    return;
  }
  
  // Get current grid dimensions
  const normalizedScenarios = parseScenarios(currentJsonData);
  const { maxRow, actualColumns } = calculateGridDimensions(normalizedScenarios);
  const totalCols = Math.max(actualColumns, minGridCols);
  const totalRows = Math.max(maxRow + 1, minGridRows);
  
  // Find first empty slot
  let emptySlot = findFirstEmptySlot(normalizedScenarios, totalRows, totalCols);
  let targetColumn, targetRow;
  
  if (emptySlot) {
    targetColumn = emptySlot.column;
    targetRow = emptySlot.row;
  } else {
    // No empty slot found, add a new row
    targetRow = totalRows;
    targetColumn = 0;
    minGridRows = totalRows + 1;
  }
  
  // Calculate ButtonIndex
  const buttonIndex = targetRow * totalCols + targetColumn;
  
  // Create duplicate scenario
  if (useCapitalized) {
    const duplicatedScenario = {
      Column: targetColumn,
      Row: targetRow,
      Title: originalScenario.Title || '',
      CharacterID: originalScenario.CharacterID || '',
      ButtonIndex: buttonIndex,
      Environment: originalScenario.Environment || '',
      Greeting: originalScenario.Greeting || ''
    };
    originalScenarios.push(duplicatedScenario);
  } else {
    const duplicatedScenario = {
      id: `scenario-${Date.now()}`,
      title: originalScenario.title || originalScenario.name || '',
      characterId: originalScenario.characterId || originalScenario.characterID || originalScenario.character_id || originalScenario.character || '',
      environment: originalScenario.environment || originalScenario.env || '',
      greeting: originalScenario.greeting || originalScenario.greetingMessage || '',
      column: targetColumn,
      row: targetRow,
      buttonIndex: buttonIndex
    };
    originalScenarios.push(duplicatedScenario);
  }
  
  // Clean up normalized fields from all scenarios
  originalScenarios = originalScenarios.map(s => {
    const sUseCapitalized = s.Title !== undefined || s.CharacterID !== undefined;
    if (sUseCapitalized) {
      const clean = {};
      if (s.Column !== undefined) clean.Column = s.Column;
      if (s.Row !== undefined) clean.Row = s.Row;
      if (s.Title !== undefined) clean.Title = s.Title;
      if (s.CharacterID !== undefined) clean.CharacterID = s.CharacterID;
      if (s.ButtonIndex !== undefined) clean.ButtonIndex = s.ButtonIndex;
      if (s.Environment !== undefined) clean.Environment = s.Environment;
      if (s.Greeting !== undefined) clean.Greeting = s.Greeting;
      return clean;
    } else {
      const clean = { ...s };
      // Remove normalized fields if they exist as duplicates
      if (clean.title && clean.Title) delete clean.title;
      if (clean.characterId && clean.CharacterID) delete clean.characterId;
      if (clean.environment && clean.Environment) delete clean.environment;
      if (clean.greeting && clean.Greeting) delete clean.greeting;
      if (clean.column !== undefined && clean.Column !== undefined) delete clean.column;
      if (clean.row !== undefined && clean.Row !== undefined) delete clean.row;
      if (clean.buttonIndex !== undefined && clean.ButtonIndex !== undefined) delete clean.buttonIndex;
      return clean;
    }
  });
  
  // Rebuild JSON structure
  const newJsonData = isArrayStructure ? originalScenarios : { scenarios: originalScenarios };
  currentJsonData = newJsonData;
  
  // Update JSON textarea
  displayJson(newJsonData);
  
  showStatus('✅ Scenario duplicated successfully');
}

/**
 * Delete scenario
 * @param {number} column - Column of scenario to delete
 * @param {number} row - Row of scenario to delete
 */
function deleteScenario(column, row) {
  if (!confirm('Are you sure you want to delete this scenario?')) {
    return;
  }
  
  // Get original scenarios to preserve structure
  let originalScenarios = [];
  let isArrayStructure = false;
  
  if (Array.isArray(currentJsonData)) {
    originalScenarios = deepClone(currentJsonData);
    isArrayStructure = true;
  } else if (currentJsonData && currentJsonData.scenarios) {
    originalScenarios = deepClone(currentJsonData.scenarios);
  }
  
  // Find the original scenario by grid position
  const useCapitalized = originalScenarios.length > 0 && 
                        (originalScenarios[0].Title !== undefined || originalScenarios[0].CharacterID !== undefined);
  
  let originalIndex = -1;
  if (useCapitalized) {
    originalIndex = originalScenarios.findIndex(s => {
      const sCol = s.Column !== undefined ? s.Column : 0;
      const sRow = s.Row !== undefined ? s.Row : 0;
      return sCol === column && sRow === row;
    });
  } else {
    originalIndex = originalScenarios.findIndex(s => {
      const sCol = s.column !== undefined ? s.column : 0;
      const sRow = s.row !== undefined ? s.row : 0;
      return sCol === column && sRow === row;
    });
  }
  
  if (originalIndex === -1) {
    showStatus('❌ Error: Scenario not found', 'error');
    return;
  }
  
  // Remove the scenario
  originalScenarios.splice(originalIndex, 1);
  
  // Clean up normalized fields from all remaining scenarios
  originalScenarios = originalScenarios.map(s => {
    const sUseCapitalized = s.Title !== undefined || s.CharacterID !== undefined;
    if (sUseCapitalized) {
      const clean = {};
      if (s.Column !== undefined) clean.Column = s.Column;
      if (s.Row !== undefined) clean.Row = s.Row;
      if (s.Title !== undefined) clean.Title = s.Title;
      if (s.CharacterID !== undefined) clean.CharacterID = s.CharacterID;
      if (s.ButtonIndex !== undefined) clean.ButtonIndex = s.ButtonIndex;
      if (s.Environment !== undefined) clean.Environment = s.Environment;
      if (s.Greeting !== undefined) clean.Greeting = s.Greeting;
      return clean;
    } else {
      // For lowercase, keep original structure but remove any normalized duplicates
      const clean = { ...s };
      // Remove normalized fields if they exist as duplicates
      if (clean.title && clean.Title) delete clean.title;
      if (clean.characterId && clean.CharacterID) delete clean.characterId;
      if (clean.environment && clean.Environment) delete clean.environment;
      if (clean.greeting && clean.Greeting) delete clean.greeting;
      if (clean.column !== undefined && clean.Column !== undefined) delete clean.column;
      if (clean.row !== undefined && clean.Row !== undefined) delete clean.row;
      if (clean.buttonIndex !== undefined && clean.ButtonIndex !== undefined) delete clean.buttonIndex;
      return clean;
    }
  });
  
  // Rebuild JSON structure
  const newJsonData = isArrayStructure ? originalScenarios : { scenarios: originalScenarios };
  currentJsonData = newJsonData;
  
  // Update JSON textarea
  displayJson(newJsonData);
  
  showStatus('✅ Scenario deleted');
}

/**
 * Handle drag start
 */
function handleDragStart(event, column, row) {
  draggedCardColumn = column;
  draggedCardRow = row;
  draggedCardElement = event.target.closest('.scenario-card');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', event.target.outerHTML);
  draggedCardElement.classList.add('dragging');
}

/**
 * Handle drag end
 */
function handleDragEnd(event) {
  event.target.closest('.scenario-card')?.classList.remove('dragging');
  // Remove drag-over class from all slots
  document.querySelectorAll('.grid-slot').forEach(slot => {
    slot.classList.remove('drag-over');
  });
  draggedCardColumn = null;
  draggedCardRow = null;
  draggedCardElement = null;
}

/**
 * Handle drag over
 */
function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

/**
 * Handle drag enter
 */
function handleDragEnter(event) {
  if (event.target.classList.contains('grid-slot')) {
    event.target.classList.add('drag-over');
  }
}

/**
 * Handle drag leave
 */
function handleDragLeave(event) {
  if (event.target.classList.contains('grid-slot')) {
    event.target.classList.remove('drag-over');
  }
}

/**
 * Handle drop
 */
function handleDrop(event, targetColumn, targetRow) {
  event.preventDefault();
  event.stopPropagation();
  
  if (draggedCardColumn === null || draggedCardRow === null) return;
  
  const scenarios = parseScenarios(currentJsonData);
  const scenario = getScenarioAtPosition(scenarios, draggedCardColumn, draggedCardRow);
  
  if (!scenario) return;
  
  // Get original scenarios to preserve structure
  let originalScenarios = [];
  let isArrayStructure = false;
  
  if (Array.isArray(currentJsonData)) {
    originalScenarios = deepClone(currentJsonData);
    isArrayStructure = true;
  } else if (currentJsonData && currentJsonData.scenarios) {
    originalScenarios = deepClone(currentJsonData.scenarios);
  }
  
  // Find the original scenario by grid position
  const hasCapitalizedFields = originalScenarios.length > 0 && 
                        (originalScenarios[0].Title !== undefined || originalScenarios[0].CharacterID !== undefined);
  
  let originalScenario = null;
  if (hasCapitalizedFields) {
    originalScenario = originalScenarios.find(s => {
      const sCol = s.Column !== undefined ? s.Column : 0;
      const sRow = s.Row !== undefined ? s.Row : 0;
      return sCol === draggedCardColumn && sRow === draggedCardRow;
    });
  } else {
    originalScenario = originalScenarios.find(s => {
      const sCol = s.column !== undefined ? s.column : 0;
      const sRow = s.row !== undefined ? s.row : 0;
      return sCol === draggedCardColumn && sRow === draggedCardRow;
    });
  }
  
  if (!originalScenario) return;
  
  // Determine field name style
  const useCapitalized = originalScenario.Title !== undefined || originalScenario.CharacterID !== undefined;
  
  // Get current grid dimensions
  const { actualColumns } = calculateGridDimensions(parseScenarios(currentJsonData));
  const totalCols = Math.max(actualColumns, minGridCols);
  
  // Check if target slot has a scenario (swap scenario positions)
  const targetScenario = originalScenarios.find(s => {
    const sCol = useCapitalized ? (s.Column !== undefined ? s.Column : 0) : (s.column !== undefined ? s.column : 0);
    const sRow = useCapitalized ? (s.Row !== undefined ? s.Row : 0) : (s.row !== undefined ? s.row : 0);
    return sCol === targetColumn && sRow === targetRow;
  });
  
  // Get original position
  const originalCol = useCapitalized ? (originalScenario.Column !== undefined ? originalScenario.Column : 0) : (originalScenario.column !== undefined ? originalScenario.column : 0);
  const originalRow = useCapitalized ? (originalScenario.Row !== undefined ? originalScenario.Row : 0) : (originalScenario.row !== undefined ? originalScenario.row : 0);
  
  // Update dragged scenario position
  const targetSlotIndex = targetRow * totalCols + targetColumn;
  
  if (useCapitalized) {
    originalScenario.Column = targetColumn;
    originalScenario.Row = targetRow;
    originalScenario.ButtonIndex = targetSlotIndex;
    
    // If swapping, update the other scenario's position
    if (targetScenario && targetScenario !== originalScenario) {
      targetScenario.Column = originalCol;
      targetScenario.Row = originalRow;
      targetScenario.ButtonIndex = originalRow * totalCols + originalCol;
    }
  } else {
    originalScenario.column = targetColumn;
    originalScenario.row = targetRow;
    originalScenario.buttonIndex = targetSlotIndex;
    
    // If swapping, update the other scenario's position
    if (targetScenario && targetScenario !== originalScenario) {
      targetScenario.column = originalCol;
      targetScenario.row = originalRow;
      targetScenario.buttonIndex = originalRow * totalCols + originalCol;
    }
  }
  
  // Clean up normalized fields from all scenarios
  originalScenarios = originalScenarios.map(s => {
    const sUseCapitalized = s.Title !== undefined || s.CharacterID !== undefined;
    if (sUseCapitalized) {
      const clean = {};
      if (s.Column !== undefined) clean.Column = s.Column;
      if (s.Row !== undefined) clean.Row = s.Row;
      if (s.Title !== undefined) clean.Title = s.Title;
      if (s.CharacterID !== undefined) clean.CharacterID = s.CharacterID;
      if (s.ButtonIndex !== undefined) clean.ButtonIndex = s.ButtonIndex;
      if (s.Environment !== undefined) clean.Environment = s.Environment;
      if (s.Greeting !== undefined) clean.Greeting = s.Greeting;
      return clean;
    }
    return s;
  });
  
  // Rebuild JSON structure
  const newJsonData = isArrayStructure ? originalScenarios : { scenarios: originalScenarios };
  currentJsonData = newJsonData;
  
  // Re-render
  renderScenarios();
  displayJson(newJsonData);
  
  showStatus('✅ Scenario moved successfully');
}

/**
 * Check if a row has any scenarios
 * @param {Array} scenarios - Array of scenarios
 * @param {number} row - Row index to check
 * @param {number} maxCol - Maximum column index
 * @returns {boolean} True if row has scenarios
 */
function rowHasScenarios(scenarios, row, maxCol) {
  for (let col = 0; col <= maxCol; col++) {
    if (getScenarioAtPosition(scenarios, col, row)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a column has any scenarios
 * @param {Array} scenarios - Array of scenarios
 * @param {number} column - Column index to check
 * @param {number} maxRow - Maximum row index
 * @returns {boolean} True if column has scenarios
 */
function columnHasScenarios(scenarios, column, maxRow) {
  for (let row = 0; row <= maxRow; row++) {
    if (getScenarioAtPosition(scenarios, column, row)) {
      return true;
    }
  }
  return false;
}

/**
 * Add a new row of empty slots
 */
function addRow() {
  if (!currentJsonData) {
    showStatus('⚠️ Please load JSON data first', 'error');
    return;
  }
  
  const scenarios = parseScenarios(currentJsonData);
  const { maxRow, maxCol, actualColumns } = calculateGridDimensions(scenarios);
  
  // If no scenarios exist, allow adding the first row
  if (scenarios.length === 0) {
    minGridRows = 1;
    renderScenarios();
    showStatus('✅ New row added');
    return;
  }
  
  // Check if the previous row (last row) has scenarios
  const lastRow = Math.max(maxRow, minGridRows - 1);
  if (lastRow >= 0 && !rowHasScenarios(scenarios, lastRow, maxCol)) {
    showStatus('⚠️ Cannot add a new row. The previous row must have at least one scenario.', 'error');
    return;
  }
  
  // Increment minimum rows to add a new row of empty slots
  const currentRows = Math.max(maxRow + 1, minGridRows);
  minGridRows = currentRows + 1;
  
  // Re-render to show the new empty slots
  renderScenarios();
  showStatus('✅ New row added');
}

/**
 * Add a new column of empty slots
 */
function addColumn() {
  if (!currentJsonData) {
    showStatus('⚠️ Please load JSON data first', 'error');
    return;
  }
  
  const scenarios = parseScenarios(currentJsonData);
  const { maxRow, maxCol, actualColumns } = calculateGridDimensions(scenarios);
  
  // If no scenarios exist, allow adding the first column (beyond default 2)
  if (scenarios.length === 0 && minGridCols <= 2) {
    minGridCols = 3;
    gridColumns = 3;
    renderScenarios();
    showStatus('✅ New column added');
    return;
  }
  
  // Check if the previous column (last column) has scenarios
  const lastCol = Math.max(maxCol, minGridCols - 1);
  if (lastCol >= 0 && !columnHasScenarios(scenarios, lastCol, maxRow)) {
    showStatus('⚠️ Cannot add a new column. The previous column must have at least one scenario.', 'error');
    return;
  }
  
  // Increment minimum columns to add a new column of empty slots
  const currentCols = Math.max(maxCol + 1, minGridCols);
  minGridCols = currentCols + 1;
  gridColumns = Math.max(gridColumns, minGridCols);
  
  // Re-render to show the new empty slots
  renderScenarios();
  showStatus('✅ New column added');
}

/**
 * Remove empty slot
 */
function removeEmptySlot(column, row) {
  const scenarios = parseScenarios(currentJsonData);
  const scenarioAtPosition = getScenarioAtPosition(scenarios, column, row);
  
  if (scenarioAtPosition) {
    showStatus('⚠️ Cannot remove slot with a scenario. Delete the scenario first.', 'error');
    return;
  }
  
  // Check if this is the last row and we can reduce minGridRows
  const { maxRow, maxCol, actualColumns } = calculateGridDimensions(scenarios);
  const totalCols = Math.max(actualColumns, minGridCols);
  const currentRows = Math.max(maxRow + 1, minGridRows);
  
  // Calculate the actual number of columns that have data (maxCol + 1)
  const dataColumns = maxCol + 1;
  
  // If removing from the last row and it's empty, reduce minGridRows
  if (row === currentRows - 1) {
    // Check if the entire last row is empty
    let lastRowEmpty = true;
    for (let col = 0; col < totalCols; col++) {
      if (getScenarioAtPosition(scenarios, col, row)) {
        lastRowEmpty = false;
        break;
      }
    }
    
    if (lastRowEmpty && minGridRows > 0) {
      minGridRows = Math.max(0, minGridRows - 1);
    }
  }
  
  // Check if this is the last column and we can reduce minGridCols
  // The last column is the one at index (totalCols - 1)
  // We can reduce if: column is the last one AND it's beyond the data columns (meaning it's an extra column)
  // Also check if we have more columns than needed (minGridCols > dataColumns)
  if (column === totalCols - 1 && minGridCols > dataColumns) {
    // Check if the entire last column is empty
    let lastColEmpty = true;
    // Check all rows up to the maximum row that has data
    for (let r = 0; r <= maxRow; r++) {
      if (getScenarioAtPosition(scenarios, column, r)) {
        lastColEmpty = false;
        break;
      }
    }
    // Also check any rows added via minGridRows
    if (lastColEmpty && minGridRows > maxRow + 1) {
      for (let r = maxRow + 1; r < currentRows; r++) {
        if (getScenarioAtPosition(scenarios, column, r)) {
          lastColEmpty = false;
          break;
        }
      }
    }
    
    if (lastColEmpty && minGridCols > 2) {
      minGridCols = Math.max(2, minGridCols - 1);
      gridColumns = Math.max(2, gridColumns);
    }
  }
  
  // Re-render
  renderScenarios();
  showStatus('✅ Empty slot removed');
}

/**
 * Internal function to refresh grid (called automatically on data load)
 */
function refreshGridInternal() {
  if (!currentJsonData) {
    minGridRows = 0;
    minGridCols = 2;
    gridColumns = 2;
    return;
  }
  
  const scenarios = parseScenarios(currentJsonData);
  
  if (scenarios.length === 0) {
    // No scenarios, reset to default
    minGridRows = 0;
    minGridCols = 2;
    gridColumns = 2;
    return;
  }
  
  // Find the actual maximum row and column that have scenarios
  let maxRowWithData = -1;
  let maxColWithData = -1;
  
  scenarios.forEach(scenario => {
    const row = scenario.row !== undefined ? scenario.row : 0;
    const col = scenario.column !== undefined ? scenario.column : 0;
    if (row > maxRowWithData) maxRowWithData = row;
    if (col > maxColWithData) maxColWithData = col;
  });
  
  // Reset minGridRows and minGridCols to match actual data
  // Add 1 because rows/columns are 0-indexed
  minGridRows = maxRowWithData + 1;
  minGridCols = Math.max(maxColWithData + 1, 2); // Minimum 2 columns
  gridColumns = minGridCols;
}

/**
 * Refresh grid - remove empty rows and columns, reset to match actual data
 */
function refreshGrid() {
  if (!currentJsonData) {
    showStatus('⚠️ Please load JSON data first', 'error');
    return;
  }
  
  refreshGridInternal();
  
  // Re-render
  renderScenarios();
  showStatus('✅ Grid refreshed - empty rows and columns removed');
}

// Make functions globally available for onclick handlers
window.editScenario = editScenario;
window.deleteScenario = deleteScenario;
window.duplicateScenario = duplicateScenario;
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDragEnter = handleDragEnter;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.addRow = addRow;
window.addColumn = addColumn;
window.removeEmptySlot = removeEmptySlot;
window.refreshGrid = refreshGrid;

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

/**
 * Handle manual update check
 */
async function handleCheckForUpdates() {
  checkUpdatesBtn.disabled = true;
  checkUpdatesBtn.textContent = 'Checking...';
  
  try {
    const result = await window.electronAPI.checkForUpdates();
    
    if (result.success) {
      if (result.updateInfo.hasUpdate) {
        showUpdateModal(result.updateInfo);
        showStatus('✅ Update available!', 'success');
      } else {
        showStatus(`✅ You're running the latest version (${result.updateInfo.currentVersion})`, 'success');
      }
    } else {
      showStatus(`❌ Update check failed: ${result.error}`, 'error');
      console.error('Update check error:', result.error);
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
    console.error('Update check exception:', error);
  } finally {
    checkUpdatesBtn.disabled = false;
    checkUpdatesBtn.textContent = 'Check for Updates';
  }
}

// Event Listeners
reloadBtn.addEventListener('click', handleFetchJson);
checkUpdatesBtn.addEventListener('click', handleCheckForUpdates);
uploadBtn.addEventListener('click', handleUploadJson);
loadFileBtn.addEventListener('click', handleLoadFromFile);
saveFileBtn.addEventListener('click', handleSaveToFile);
viewModeBtn.addEventListener('click', toggleViewMode);
addScenarioBtn.addEventListener('click', () => openScenarioModal(null));
addRowBtn.addEventListener('click', addRow);
addColumnBtn.addEventListener('click', addColumn);
refreshGridBtn.addEventListener('click', refreshGrid);
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

// Update Modal Elements
const updateModal = document.getElementById('updateModal');
const updateModalTitle = document.getElementById('updateModalTitle');
const closeUpdateModalBtn = document.getElementById('closeUpdateModalBtn');
const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
const downloadUpdateBtn = document.getElementById('downloadUpdateBtn');
const openDownloadsBtn = document.getElementById('openDownloadsBtn');
const currentVersionSpan = document.getElementById('currentVersion');
const latestVersionSpan = document.getElementById('latestVersion');
const updateReleaseNotes = document.getElementById('updateReleaseNotes');
const updateDownloadProgress = document.getElementById('updateDownloadProgress');
const updateProgressBar = document.getElementById('updateProgressBar');
const updateProgressText = document.getElementById('updateProgressText');
const updateDownloaded = document.getElementById('updateDownloaded');
const updateInfoDiv = document.getElementById('updateInfo');

let currentUpdateInfo = null;

/**
 * Show update modal
 */
function showUpdateModal(updateInfo) {
  currentUpdateInfo = updateInfo;
  currentVersionSpan.textContent = updateInfo.currentVersion;
  latestVersionSpan.textContent = updateInfo.latestVersion;
  
  // Format release notes (convert markdown-like text to HTML)
  if (updateInfo.releaseNotes) {
    const notes = updateInfo.releaseNotes
      .split('\n')
      .map(line => {
        // Convert markdown headers
        if (line.startsWith('## ')) {
          return `<h4 style="margin-top: 1rem; margin-bottom: 0.5rem;">${line.substring(3)}</h4>`;
        }
        if (line.startsWith('### ')) {
          return `<h5 style="margin-top: 0.75rem; margin-bottom: 0.25rem;">${line.substring(4)}</h5>`;
        }
        // Convert bullet points
        if (line.trim().startsWith('- ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        // Regular paragraph
        if (line.trim()) {
          return `<p style="margin: 0.25rem 0;">${line}</p>`;
        }
        return '';
      })
      .filter(line => line)
      .join('');
    
    updateReleaseNotes.innerHTML = notes || '<p>No release notes available.</p>';
  } else {
    updateReleaseNotes.innerHTML = '<p>No release notes available.</p>';
  }
  
  // Reset UI state
  updateDownloadProgress.classList.add('hidden');
  updateDownloaded.classList.add('hidden');
  openDownloadsBtn.classList.add('hidden');
  downloadUpdateBtn.classList.remove('hidden');
  downloadUpdateBtn.disabled = false;
  updateInfoDiv.classList.remove('hidden');
  
  updateModal.classList.remove('hidden');
}

/**
 * Close update modal
 */
function closeUpdateModal() {
  updateModal.classList.add('hidden');
  currentUpdateInfo = null;
}

/**
 * Handle download update
 */
async function handleDownloadUpdate() {
  if (!currentUpdateInfo || !currentUpdateInfo.downloadUrl) {
    showStatus('❌ Download URL not available', 'error');
    return;
  }
  
  downloadUpdateBtn.disabled = true;
  updateInfoDiv.classList.add('hidden');
  updateDownloadProgress.classList.remove('hidden');
  updateProgressBar.style.width = '0%';
  updateProgressText.textContent = '0%';
  
  try {
    // Pass the filename from updateInfo if available
    const fileName = currentUpdateInfo.fileName || null;
    const result = await window.electronAPI.downloadUpdate(currentUpdateInfo.downloadUrl, fileName);
    
    if (result.success) {
      updateDownloadProgress.classList.add('hidden');
      updateDownloaded.classList.remove('hidden');
      downloadUpdateBtn.classList.add('hidden');
      openDownloadsBtn.classList.remove('hidden');
      showStatus(`✅ Update downloaded to: ${result.fileName}`, 'success');
    } else {
      showStatus(`❌ Download failed: ${result.error}`, 'error');
      updateInfoDiv.classList.remove('hidden');
      updateDownloadProgress.classList.add('hidden');
      downloadUpdateBtn.disabled = false;
    }
  } catch (error) {
    showStatus(`❌ Error: ${error.message}`, 'error');
    updateInfoDiv.classList.remove('hidden');
    updateDownloadProgress.classList.add('hidden');
    downloadUpdateBtn.disabled = false;
  }
}

/**
 * Handle open downloads folder
 */
async function handleOpenDownloadsFolder() {
  try {
    await window.electronAPI.openDownloadsFolder();
  } catch (error) {
    showStatus(`❌ Error opening downloads folder: ${error.message}`, 'error');
  }
}

// Update modal event listeners
closeUpdateModalBtn.addEventListener('click', closeUpdateModal);
cancelUpdateBtn.addEventListener('click', closeUpdateModal);
downloadUpdateBtn.addEventListener('click', handleDownloadUpdate);
openDownloadsBtn.addEventListener('click', handleOpenDownloadsFolder);

// Close update modal when clicking outside
updateModal.addEventListener('click', (e) => {
  if (e.target === updateModal) {
    closeUpdateModal();
  }
});

// Listen for update available event
window.electronAPI.onUpdateAvailable((updateInfo) => {
  console.log('Update available event received:', updateInfo);
  showUpdateModal(updateInfo);
});

// Listen for download progress
window.electronAPI.onDownloadProgress((progress) => {
  const percent = progress.percent || 0;
  updateProgressBar.style.width = `${percent}%`;
  updateProgressText.textContent = `${percent}%`;
  
  // Format file size
  const transferredMB = (progress.transferred / (1024 * 1024)).toFixed(2);
  const totalMB = (progress.total / (1024 * 1024)).toFixed(2);
  updateProgressText.textContent = `${percent}% (${transferredMB} MB / ${totalMB} MB)`;
});

