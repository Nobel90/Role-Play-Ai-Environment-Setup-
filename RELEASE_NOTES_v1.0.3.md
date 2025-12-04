# Release Notes - Version 1.0.3

## 🎉 Major Update: Code Signing Infrastructure

This release includes a complete update to the code signing system, bringing it in line with the other Role-Play-AI applications for consistency and improved security.

---

## ✨ New Features

### Code Signing System
- **Unified Signing Method**: Migrated to USB Token signing via Windows Certificate Store (consistent with Launcher and Uploader)
- **Hook-Based Signing**: Implemented proper Electron-Builder hooks:
  - `afterSign` hook for signing the main application executable
  - `afterAllArtifactBuild` hook for signing portable artifacts
- **Automated Manifest Updates**: Automatically updates `latest.yml` with correct SHA512 checksums after signing

### Build System Improvements
- **New Build Script**: Added `build-signed.ps1` for streamlined signed builds
- **Modular Signing Utilities**: Created `sign-utils.js` as a reusable utility module
- **Enhanced Error Handling**: All signing functions now throw errors on failure, ensuring builds fail fast if signing issues occur

---

## 🔧 Technical Changes

### File Structure
- **New Files**:
  - `sign-utils.js` - Utility module for signing functions
  - `scripts/sign-app.js` - Hook script for signing application executable
  - `scripts/sign-installer.js` - Hook script for signing portable artifacts
  - `build-signed.ps1` - PowerShell build script for signed builds

### Configuration Updates
- **package.json**:
  - Removed `afterPack: "sign.js"` hook
  - Added `afterSign` and `afterAllArtifactBuild` hooks
  - Enabled `signAndEditExecutable: true` to preserve icon during signing
  - Updated version to 1.0.3

### Signing Process
1. Electron-Builder embeds icon first (`signAndEditExecutable: true`)
2. `afterSign` hook signs the main app executable (`VRC Character Updater.exe`)
3. `afterAllArtifactBuild` hook signs portable executable
4. Build fails immediately if certificate is missing or signing fails
5. `latest.yml` is automatically updated with correct checksums

---

## 🔐 Signing Requirements

- **Environment Variable**: `WIN_CERTIFICATE_SHA1` must be set (or entered when prompted)
- **USB Token**: Sectigo USB Token must be plugged in
- **SafeNet Client**: Must be running and showing "Ready" status
- **Timestamp Server**: http://timestamp.digicert.com (default)

---

## 📋 Build Instructions

### Prerequisites
- Windows 10/11
- Node.js and npm installed
- Windows SDK (for signtool.exe)
- Sectigo USB Token connected
- SafeNet Client running and ready

### Building the Application

**Using PowerShell Script (Recommended)**:
```powershell
.\build-signed.ps1
```

**Using npm directly**:
```bash
npm run build:win
```

The build script will:
1. Check for `WIN_CERTIFICATE_SHA1` environment variable
2. Prompt if not set
3. Remind you to connect your USB token
4. Build and sign the portable executable
5. Update `latest.yml` with correct checksums

---

## 🐛 Bug Fixes

- **Fixed**: Inconsistent signing method compared to other Role-Play-AI applications
- **Fixed**: Manual manifest updates required after signing
- **Fixed**: Icon preservation during signing process

---

## 📦 Distribution

### Portable Executable
- **File**: `VRC Character Updater-1.0.3-portable.exe`
- **Platform**: Windows x64
- **Requirements**: Windows 10 or later
- **Signed**: Code-signed with Sectigo certificate

### Installation
No installation required! Simply:
1. Download the portable executable from the releases page
2. Run it from any location
3. Start managing your scenarios

---

## 🔄 Auto-Update

The application will automatically check for updates when you start it. If an update is available:
- It will be downloaded in the background
- You'll be notified when the download completes
- The update will be installed when you restart the application

---

## 📝 Notes

- The old `sign.js` file is still present but no longer used by the build system
- All signing now uses the hook-based approach for better compatibility
- Icon preservation is handled automatically by Electron-Builder before signing
- Signing infrastructure is now consistent across all Role-Play-AI applications

---

## 🚀 What's Next

- Continue monitoring build reliability
- Potential future improvements to signing workflow
- Enhanced error messages and diagnostics
- Feature updates based on user feedback

---

## 📦 Files Changed

### New Files
- `sign-utils.js`
- `scripts/sign-app.js`
- `scripts/sign-installer.js`
- `build-signed.ps1`

### Modified Files
- `package.json` - Updated build configuration and version

---

**Version**: 1.0.3  
**Release Date**: December 2024  
**Compatibility**: Windows 10/11, Electron-Builder v26+
