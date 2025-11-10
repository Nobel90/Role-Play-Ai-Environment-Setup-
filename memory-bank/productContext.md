# Product Context

## Why This Project Exists
This application exists as an **administrative control panel** for a UE5 VR application. The original Python tkinter application provided basic JSON editing capabilities. This Electron version was created to:
- Provide admins with a tool to manage scenarios/environments for the UE5 app
- Enable non-technical admins to add/remove/configure scenarios without editing raw JSON
- Ensure configurations are properly validated before being sent to JSONBin.io
- Provide a modern, cross-platform admin tool

## Problems It Solves
1. **Scenario Management**: Admins need to easily add/remove scenarios that appear in the UE5 app's menu
2. **Environment Configuration**: Each scenario needs an associated environment that loads in UE5
3. **Character Configuration**: Each scenario may have associated characters (e.g., "Betty", "Joshua", "David", "Rachael")
4. **Menu Card Configuration**: The JSON controls how scenario cards are displayed in the UE5 "Scenario Selection" menu
5. **Remote Configuration**: Configurations must be stored in JSONBin.io so the UE5 app can read them dynamically
6. **Validation**: Prevents invalid configurations from breaking the UE5 app

## Integration with UE5 App
- The UE5 app reads JSON from JSONBin.io on startup/menu load
- JSON structure determines which scenario cards appear in the "Scenario Selection" menu
- Each scenario card (e.g., "Having Difficult Conversations - Betty") corresponds to a JSON entry
- When a user selects a scenario, the UE5 app loads the associated environment

## How It Should Work
1. **On Launch**: Application automatically fetches JSON from configured JSONBin endpoint
2. **Editing**: Users can edit JSON directly in the text editor
3. **File Loading**: Users can load JSON from local files to edit
4. **Uploading**: Users can upload modified JSON back to JSONBin.io
5. **Validation**: JSON is validated before upload to prevent errors

## User Experience Goals
- **Simple**: Minimal UI, easy to understand
- **Fast**: Quick loading and response times
- **Reliable**: Proper error handling and user feedback
- **Modern**: Dark theme, clean design
- **Responsive**: Clear status messages and loading indicators

