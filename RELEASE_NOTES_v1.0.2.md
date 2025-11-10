# Release Notes - Version 1.0.2

## 🔄 Custom Portable Updater

### New Feature
- **Custom Update Mechanism**: Implemented custom update system for portable builds
  - Checks GitHub releases for new versions
  - Downloads updates to Downloads folder
  - Shows update modal with version info and release notes
  - Real-time download progress with file size display
  - Manual replacement workflow for portable executables

### Technical Changes
- Removed `electron-updater` dependency (not compatible with portable builds)
- Added custom `portable-updater.js` module
- Integrated GitHub Releases API for version checking
- Added update UI with download progress tracking

## 🎯 Testing
This version includes the custom update mechanism. Run version 1.0.1 to test if it detects and downloads version 1.0.2.

---

**Full Changelog**: See commit history for detailed changes

