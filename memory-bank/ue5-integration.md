# UE5 Integration Context

## Application Relationship

### Role-Play-Ai Environment Setup (This App)
- **Type**: Admin control panel (Electron desktop app)
- **Purpose**: Manage scenarios, characters, and environments
- **Output**: JSON configuration uploaded to JSONBin.io

### UE5 VR Application
- **Type**: Unreal Engine 5 VR application
- **Purpose**: Training/educational scenarios in VR
- **Input**: Reads JSON from JSONBin.io
- **Display**: Shows scenario cards in "Scenario Selection" menu

## Data Flow

```
Admin Tool (This App)
    ↓
Edit/Configure Scenarios
    ↓
JSON Structure Created
    ↓
Upload to JSONBin.io
    ↓
UE5 App Reads JSONBin.io
    ↓
Displays Scenario Cards in Menu
    ↓
User Selects Scenario
    ↓
UE5 Loads Associated Environment
```

## JSON Structure (Inferred)

Based on the scenario cards shown in the image:
- "Having Difficult Conversations - Betty"
- "Shared Decision Making - Joshua"
- "Motivational Interviewing - David"
- "Patient - Rachael"

The JSON likely contains:
- Array of scenarios
- Each scenario has:
  - Title/Name (e.g., "Having Difficult Conversations")
  - Character name (e.g., "Betty")
  - Environment identifier
  - Possibly other metadata (description, difficulty, etc.)

## Scenario Card Display

The UE5 app displays scenarios as:
- Grid layout (2 columns visible in image)
- White-bordered cards
- Centered text with scenario name and character
- Scrollable list (scrollbar visible)
- Clickable/interactive cards

## Admin Workflow

1. Admin opens this Electron app
2. Fetches current JSON from JSONBin.io
3. Adds/removes/modifies scenarios
4. Configures environment for each scenario
5. Validates JSON
6. Uploads to JSONBin.io
7. UE5 app reads updated JSON on next load
8. New scenarios appear in UE5 menu

## Current Implementation Status

**Current State**: 
- App allows raw JSON editing
- Can fetch/upload to JSONBin.io
- Can load/save JSON files locally
- JSON validation before upload

**Potential Enhancements**:
- Scenario management UI (add/remove scenarios visually)
- Form-based scenario configuration
- Preview of how scenarios will appear
- Environment selector/manager
- Character management interface

