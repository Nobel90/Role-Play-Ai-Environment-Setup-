# Code Signing Setup Guide

This guide explains how to set up code signing for Windows executables using a USB code signing certificate (including SafeNet USB tokens).

## Prerequisites

1. **Windows SDK** or **Visual Studio Build Tools** installed (includes `signtool.exe`)
   - Download from: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
   - Or install via Visual Studio Installer

2. **USB Code Signing Certificate** (e.g., SafeNet USB token)
   - USB token connected to your computer
   - SafeNet Authentication Client installed (if using SafeNet)
   - Certificate accessible via Windows Certificate Store

3. **Certificate Access**: The certificate should be accessible via:
   - Windows Certificate Store (recommended for USB tokens), OR
   - Exported as a `.pfx` file

## Quick Setup for USB Tokens (SafeNet or Other)

**This is the recommended method for USB token signing!**

1. **Make sure your USB token is connected** and unlocked (enter PIN if prompted)

2. **Run the setup script** to configure signing:
   ```powershell
   .\set-signing-env.ps1
   ```
   
   This script will:
   - Detect your USB token certificate
   - Set the `CSC_NAME` environment variable automatically
   - Show you the certificate details

3. **Build with signing**:
   ```bash
   npm run build:win
   ```
   
   **Note**: You will be prompted for your USB token PIN during the signing process.

**Alternative**: If you prefer to set it manually, run:
```powershell
.\setup-signing.ps1  # To find your certificate name
$env:CSC_NAME = "Your Certificate Subject Name"  # Set it manually
npm run build:win
```

## Setup Methods

### Method 1: Using Certificate File (.pfx)

1. **Export your certificate to a .pfx file**:
   - Open Certificate Manager (`certmgr.msc`)
   - Find your code signing certificate
   - Right-click → All Tasks → Export
   - Choose "Yes, export the private key"
   - Select .pfx format
   - Set a password
   - Save the file (e.g., `code-signing-cert.pfx`)

2. **Set environment variables**:
   ```powershell
   # In PowerShell (temporary for current session)
   $env:CSC_LINK = "C:\path\to\your\code-signing-cert.pfx"
   $env:CSC_KEY_PASSWORD = "your-certificate-password"
   ```

   Or create a `.env` file in the project root:
   ```
   CSC_LINK=C:\path\to\your\code-signing-cert.pfx
   CSC_KEY_PASSWORD=your-certificate-password
   ```

3. **Build with signing**:
   ```bash
   npm run build:win
   ```

### Method 2: Using Certificate from Windows Certificate Store (DEFAULT - USB Tokens)

**This is now the default method!** The build system is configured to use USB tokens directly.

1. **Make sure your USB token is connected** and unlocked

2. **For SafeNet tokens**: Open SafeNet Authentication Client and verify the certificate is visible

3. **Set up the environment variable** (choose one method):

   **Option A - Automatic Setup (Recommended)**:
   ```powershell
   .\set-signing-env.ps1
   ```
   This will automatically detect and configure your certificate.

   **Option B - Manual Setup**:
   ```powershell
   # Find your certificate
   .\setup-signing.ps1
   
   # Then set the environment variable
   $env:CSC_NAME = "CN=Your Name, O=Your Organization, ..."
   # Or use thumbprint:
   # $env:CSC_NAME = "A1B2C3D4E5F6..."
   ```

4. **Build with signing**:
   ```bash
   npm run build:win
   ```

**Important Notes**:
- The environment variable (`CSC_NAME`) is only set for the current PowerShell session
- You will be prompted for your USB token PIN during signing
- Make sure your USB token stays connected during the entire build process
- If `CSC_NAME` is not set, the system will auto-detect the first available code signing certificate

### Method 3: Automatic Certificate Selection

If your USB certificate is the only code signing certificate available:

1. **Ensure your USB token is connected** and certificate is accessible

2. **Build with signing** (no environment variables needed):
   ```bash
   npm run build:win
   ```

   The script will automatically use the first available code signing certificate.

## Environment Variables Reference

| Variable | Description | Required For |
|----------|-------------|--------------|
| `CSC_LINK` | Path to .pfx certificate file | Method 1 |
| `CSC_KEY_PASSWORD` | Password for .pfx certificate | Method 1 |
| `CSC_NAME` | Certificate subject name or thumbprint | Method 2 |
| `CSC_TIMESTAMP_SERVER` | Timestamp server URL (optional) | All methods |

Default timestamp server: `http://timestamp.digicert.com`

## Verifying Signatures

After building, verify the signature:

```powershell
signtool verify /pa /v "dist\VRC Character Updater-1.0.1-portable.exe"
```

Or use the verification script:
```bash
node sign.js verify "dist\VRC Character Updater-1.0.1-portable.exe"
```

## Troubleshooting

### Error: "signtool.exe not found"
- Install Windows SDK or Visual Studio Build Tools
- Add SDK bin directory to PATH:
  ```powershell
  $env:PATH += ";C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64"
  ```

### Error: "No certificates were found"
- Ensure USB token is connected
- Check certificate is installed in Certificate Store
- Verify certificate has code signing capability
- Try using Method 1 (export to .pfx)

### Error: "The specified password is not correct"
- Double-check `CSC_KEY_PASSWORD` environment variable
- Ensure no extra spaces or quotes

### Error: "Access denied" or "Certificate not accessible"
- Run PowerShell/Command Prompt as Administrator
- Check USB token drivers are installed
- Verify certificate permissions

## Security Best Practices

1. **Never commit certificate files or passwords to git**
   - Add `.pfx` files to `.gitignore`
   - Use environment variables, not hardcoded values

2. **Use secure storage for certificates**
   - Consider using Windows Certificate Store
   - Use hardware tokens (USB) when possible

3. **Protect certificate passwords**
   - Use environment variables
   - Consider using secret management tools for CI/CD

## CI/CD Integration

For automated builds, set environment variables in your CI/CD system:

```yaml
# Example for GitHub Actions
env:
  CSC_LINK: ${{ secrets.CSC_LINK }}
  CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
```

## Additional Resources

- [Microsoft Code Signing Documentation](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [signtool.exe Reference](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool)

