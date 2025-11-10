# Project Brief

## Overview
**Role-Play-Ai Environment Setup** (also known as "VRC Character Updater") is an Electron desktop application that serves as an **admin control panel** for managing scenarios, characters, and environments for an Unreal Engine 5 VR application. This is a port/rewrite of a Python tkinter application (`VRC_Character_Updater_Improved.py`) into a modern Electron-based desktop app.

## Core Purpose
The application serves as an administrative tool that allows admins to:
- **Add/Remove Scenarios**: Manage the list of scenarios that appear in the UE5 app's main menu
- **Configure Environments**: Specify which environment loads for each scenario
- **Manage Characters**: Add, remove, and configure characters for each scenario
- **Control Menu Display**: Configure how scenario cards appear in the UE5 app's "Scenario Selection" menu

## Workflow
1. **Admin uses this tool** to add/remove/configure scenarios, characters, and environments
2. **Configurations are saved as JSON** and uploaded to JSONBin.io
3. **UE5 app reads from JSONBin.io** and dynamically displays scenario cards in the main menu
4. **End users see the configured scenarios** as interactive cards (e.g., "Having Difficult Conversations - Betty", "Shared Decision Making - Joshua")

## Target Users
**Primary Users**: Administrators who need to manage the scenarios and environments displayed in the UE5 VR application.

**End Users**: VR users who interact with the UE5 app and see the configured scenarios as menu cards.

## Key Requirements
1. **API Integration**: Seamless integration with JSONBin.io API v3
2. **JSON Editing**: User-friendly text editor for JSON data
3. **File Operations**: Load JSON from local files
4. **Validation**: Automatic JSON validation before upload
5. **Dark Theme UI**: Modern dark theme matching ttkbootstrap darkly style
6. **Cross-platform**: Windows, macOS, and Linux support
7. **Security**: Context isolation, no Node.js integration in renderer

## Success Criteria
- All core features working (fetch, edit, load, upload)
- JSON validation working correctly
- Dark theme UI implemented
- Cross-platform builds working
- Unit tests passing
- Application builds successfully for all platforms

