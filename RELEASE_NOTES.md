# Release Notes - Version 1.0.0

## 🎉 Major Features

### Visual Scenario Management
- **Grid-Based Interface**: Drag-and-drop grid system for organizing scenarios
- **Card View**: Beautiful card-based display showing scenario details
- **Form-Based Editing**: Easy-to-use forms for adding and editing scenarios
- **Dual Mode**: Switch between visual mode and raw JSON editor

### Scenario Configuration
- **Environment Dropdown**: Pre-configured environment options with display names
  - Hospital - Betty → `BDS_Hospital`
  - Hospital - Joshua → `BDS_Hospital_Male`
  - Hospital - David → `BDS_Hospital_Male_David`
  - Hospital - Rachael → `BDS_Hospital_Rachael`
- **Auto-Generated Fields**: Column, Row, and Button Index automatically calculated
- **Field Validation**: Prompts for missing required fields
- **Smart Field Mapping**: Handles various JSON field name formats automatically

### Grid Management
- **Drag & Drop**: Move scenarios between slots by dragging cards
- **Add Rows/Columns**: Expand the grid as needed
- **Empty Slot Management**: Visual indicators for empty slots with remove option
- **Refresh Grid**: Clean up empty rows and columns automatically
- **Fixed Slot Sizes**: Consistent 250px height slots for better organization

### Portable Build
- **No Installation Required**: Single executable file that runs anywhere
- **Smaller Size**: Optimized to ~82 MB (down from 94 MB)
- **Maximum Compression**: Excluded unnecessary files (tests, docs, dev files)
- **Ready to Use**: Just download and run

### Auto-Update System
- **GitHub Releases Integration**: Automatic updates from GitHub releases
- **Background Updates**: Checks for updates on startup
- **Auto-Download**: Downloads updates automatically
- **Seamless Installation**: Updates install on app restart

## 🔧 Improvements

### JSON Handling
- **Structure Preservation**: Maintains original JSON field name capitalization
- **No Duplicate Fields**: Clean JSON output without normalized duplicates
- **Flexible Parsing**: Handles various JSON structures and field name variations
- **Deep Cloning**: Prevents data corruption during operations

### User Experience
- **Visual Feedback**: Drag-over highlights, loading states, and status messages
- **Error Handling**: Clear error messages and validation feedback
- **Responsive Design**: Modern dark theme UI
- **Intuitive Controls**: Easy-to-understand buttons and actions

### Performance
- **Optimized Build**: Excluded unnecessary files from distribution
- **Efficient Rendering**: Smart grid calculation and slot management
- **Fast Operations**: Optimized drag-and-drop and scenario operations

## 📋 Technical Details

### New Dependencies
- `electron-updater@^6.6.2` - Auto-update functionality

### Build Configuration
- Portable build target for Windows
- GitHub releases publishing configuration
- Maximum compression enabled
- Optimized file inclusion

### API Enhancements
- Auto-update IPC handlers
- Update event listeners
- Manual update check functionality

## 🐛 Bug Fixes
- Fixed JSON structure preservation when editing scenarios
- Fixed duplicate field issue when saving
- Fixed field name normalization for capitalized JSON
- Fixed auto-updater API usage for electron-updater v6.x
- Fixed empty slot detection and management

## 📦 Distribution

### Portable Executable
- **File**: `VRC Character Updater-1.0.0-portable.exe`
- **Size**: ~82 MB
- **Platform**: Windows x64
- **Requirements**: Windows 10 or later

### Installation
No installation required! Simply:
1. Download the portable executable
2. Run it from any location
3. Start managing your scenarios

## 🚀 Getting Started

1. **Download** the portable executable from the releases page
2. **Run** the application (no installation needed)
3. **Load** your JSON from JSONBin.io or a local file
4. **Switch** to Visual Mode to use the grid interface
5. **Drag & Drop** scenarios to reorganize them
6. **Add/Edit** scenarios using the form interface
7. **Save** your changes back to JSONBin.io or a local file

## 🔄 Auto-Update

The application will automatically check for updates when you start it. If an update is available:
- It will be downloaded in the background
- You'll be notified when the download completes
- The update will be installed when you restart the application

## 📝 Notes

- The portable build includes all necessary dependencies
- Auto-update only works in production builds (not in development)
- Grid dimensions are automatically calculated based on scenario positions
- Empty slots are preserved until manually removed or grid is refreshed

## 🙏 Thank You

Thank you for using VRC Character Updater! We hope you enjoy the new visual interface and improved workflow.

---

**Full Changelog**: See commit history for detailed changes

