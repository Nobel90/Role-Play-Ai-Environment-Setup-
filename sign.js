/**
 * Custom Code Signing Script for electron-builder
 * This script handles code signing for Windows executables
 * 
 * This is called as an afterSign hook by electron-builder
 * The context parameter contains information about the signed file
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Find signtool.exe in common Windows SDK locations
 * @returns {string|null} Path to signtool.exe or null if not found
 */
function findSignTool() {
  // Check if signtool is in PATH
  try {
    execSync('signtool.exe /?', { encoding: 'utf8', stdio: 'ignore' });
    return 'signtool.exe';
  } catch (e) {
    // Not in PATH, search common locations
  }

  // Common Windows SDK installation paths
  const programFiles = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles || 'C:\\Program Files (x86)';
  const programFiles64 = process.env.ProgramFiles || 'C:\\Program Files';
  
  const possiblePaths = [
    // Windows Kits 10 (most common)
    path.join(programFiles, 'Windows Kits', '10', 'bin', '10.0.26100.0', 'x64', 'signtool.exe'),
    path.join(programFiles, 'Windows Kits', '10', 'bin', '10.0.22621.0', 'x64', 'signtool.exe'),
    path.join(programFiles, 'Windows Kits', '10', 'bin', '10.0.22000.0', 'x64', 'signtool.exe'),
    path.join(programFiles, 'Windows Kits', '10', 'bin', '10.0.19041.0', 'x64', 'signtool.exe'),
    path.join(programFiles, 'Windows Kits', '10', 'bin', '10.0.18362.0', 'x64', 'signtool.exe'),
    // Try to find latest version dynamically
    ...(() => {
      const kitsPath = path.join(programFiles, 'Windows Kits', '10', 'bin');
      if (fs.existsSync(kitsPath)) {
        try {
          const versions = fs.readdirSync(kitsPath)
            .filter(v => v.startsWith('10.0.'))
            .sort()
            .reverse(); // Latest first
          
          return versions.map(v => path.join(kitsPath, v, 'x64', 'signtool.exe'));
        } catch (e) {
          return [];
        }
      }
      return [];
    })(),
    // Visual Studio Build Tools
    path.join(programFiles, 'Microsoft SDKs', 'Windows', 'v10.0A', 'bin', 'NETFX 4.8 Tools', 'x64', 'signtool.exe'),
    path.join(programFiles, 'Microsoft SDKs', 'Windows', 'v10.0A', 'bin', 'NETFX 4.8 Tools', 'signtool.exe'),
  ];

  // Check each possible path
  for (const signtoolPath of possiblePaths) {
    if (fs.existsSync(signtoolPath)) {
      console.log(`Found signtool.exe at: ${signtoolPath}`);
      return signtoolPath;
    }
  }

  return null;
}

/**
 * Sign an executable file using signtool
 * @param {string} filePath - Path to the file to sign
 * @param {Object} options - Signing options (for direct calls)
 */
function signFile(filePath, options = {}) {
  console.log(`Signing file: ${filePath}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Get signing configuration from environment variables
  const certificateFile = process.env.CSC_LINK;
  const certificatePassword = process.env.CSC_KEY_PASSWORD;
  const certificateSubjectName = process.env.CSC_NAME;
  const timestampServer = process.env.CSC_TIMESTAMP_SERVER || 'http://timestamp.digicert.com';

  // Determine signing method
  // Priority: Certificate Store (USB token) > Auto-detect > Certificate File
  let signCommand;

  // Find signtool first
  const signtoolPath = findSignTool();
  if (!signtoolPath) {
    throw new Error('signtool.exe not found. Please install Windows SDK or Visual Studio Build Tools.\n' +
      'Installed location: C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\signtool.exe\n' +
      'You can also set SIGNTOOL_PATH environment variable to point to signtool.exe');
  }

  if (certificateSubjectName) {
    // Method 1 (Preferred): Sign using certificate from Windows Certificate Store (USB token)
    console.log(`Using certificate from Windows Certificate Store: ${certificateSubjectName}`);
    console.log('Make sure your USB token is connected and unlocked.');
    
    const escapedSubjectName = `"${certificateSubjectName}"`;
    const escapedFilePath = `"${filePath}"`;
    const escapedTimestamp = `"${timestampServer}"`;

    // Use /n to specify certificate by subject name or thumbprint
    // Use /tr for RFC 3161 timestamping (modern, SHA-256 compatible)
    signCommand = `"${signtoolPath}" sign /n ${escapedSubjectName} /tr ${escapedTimestamp} /td sha256 /fd sha256 ${escapedFilePath}`;
  } else if (certificateFile) {
    // Method 2: Sign using .pfx certificate file (fallback)
    console.log('Using certificate file for signing...');
    
    if (!certificatePassword) {
      throw new Error('CSC_KEY_PASSWORD environment variable is required when using CSC_LINK');
    }

    // Escape paths and passwords for command line
    const escapedCertFile = `"${path.resolve(certificateFile)}"`;
    const escapedPassword = certificatePassword.replace(/"/g, '\\"');
    const escapedFilePath = `"${filePath}"`;
    const escapedTimestamp = `"${timestampServer}"`;

    signCommand = `"${signtoolPath}" sign /f ${escapedCertFile} /p "${escapedPassword}" /tr ${escapedTimestamp} /td sha256 /fd sha256 ${escapedFilePath}`;
  } else {
    // Method 3: Auto-detect certificate from USB token
    console.log('Auto-detecting code signing certificate from USB token...');
    console.log('Make sure your USB token is connected and unlocked.');

    // Use /a flag to automatically select the best certificate
    // This requires the certificate to be accessible via Windows Certificate Store
    const escapedFilePath = `"${filePath}"`;
    const escapedTimestamp = `"${timestampServer}"`;
    
    signCommand = `"${signtoolPath}" sign /a /tr ${escapedTimestamp} /td sha256 /fd sha256 ${escapedFilePath}`;
  }

  try {
    console.log(`Executing: ${signCommand.replace(/\/p "[^"]*"/, '/p "***"')}`);
    const output = execSync(signCommand, {
      encoding: 'utf8',
      stdio: 'inherit',
      shell: true
    });
    console.log(`✓ Successfully signed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to sign ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Verify the signature of a signed file
 * @param {string} filePath - Path to the signed file
 */
function verifySignature(filePath) {
  console.log(`Verifying signature: ${filePath}`);
  
  const signtoolPath = findSignTool();
  if (!signtoolPath) {
    console.error('signtool.exe not found for verification');
    return false;
  }
  
  try {
    const escapedFilePath = `"${filePath}"`;
    const output = execSync(`"${signtoolPath}" verify /pa /v ${escapedFilePath}`, {
      encoding: 'utf8',
      stdio: 'inherit',
      shell: true
    });
    console.log(`✓ Signature verified: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Signature verification failed: ${error.message}`);
    return false;
  }
}

// Export for electron-builder afterPack hook
// electron-builder calls this function with context: { appOutDir, outDir, arch, platform, electronPlatformName, ... }
// For portable builds, we need to find the .exe file in the output directory
module.exports = async function(context) {
  console.log('\n=== afterPack hook called ===');
  console.log('Context:', JSON.stringify({
    platform: context.platform,
    electronPlatformName: context.electronPlatformName,
    appOutDir: context.appOutDir,
    outDir: context.outDir,
    path: context.path
  }, null, 2));
  
  // For Windows, sign the executable
  if (context.platform === 'win32' || context.electronPlatformName === 'win32') {
    // For portable builds, the executable might be in different locations
    // Try multiple possible locations
    const possibleDirs = [
      context.appOutDir,
      context.outDir,
      context.outDir ? path.join(context.outDir, 'win-unpacked') : null,
      context.path ? path.dirname(context.path) : null
    ].filter(Boolean);
    
    let exePath = null;
    
    // First, try to find the .exe in the output directories
    for (const dir of possibleDirs) {
      if (!dir || !fs.existsSync(dir)) continue;
      
      try {
        const files = fs.readdirSync(dir);
        const exeFile = files.find(f => f.endsWith('.exe') && !f.includes('unpacked') && !f.includes('Helper'));
        if (exeFile) {
          exePath = path.join(dir, exeFile);
          console.log(`Found executable in ${dir}: ${exeFile}`);
          break;
        }
      } catch (error) {
        console.warn(`Could not read directory ${dir}: ${error.message}`);
      }
    }
    
    // Fallback: try context.path if available
    if (!exePath && context.path && context.path.endsWith('.exe')) {
      exePath = context.path;
      console.log(`Using executable from context.path: ${exePath}`);
    }
    
    // Last resort: look in the dist directory
    if (!exePath) {
      const distDir = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        try {
          const files = fs.readdirSync(distDir);
          const exeFile = files.find(f => f.endsWith('.exe') && f.includes('portable'));
          if (exeFile) {
            exePath = path.join(distDir, exeFile);
            console.log(`Found executable in dist directory: ${exeFile}`);
          }
        } catch (error) {
          console.warn(`Could not read dist directory: ${error.message}`);
        }
      }
    }
    
    if (!exePath) {
      console.error('✗ Could not find executable file to sign');
      console.error('Searched in:', possibleDirs);
      return;
    }
    
    // Check if this is an executable file
    if (exePath.endsWith('.exe') || exePath.endsWith('.dll')) {
      console.log(`\n=== Processing executable ===`);
      console.log(`Executable path: ${exePath}`);
      try {
        // Apply icon BEFORE signing (signing can prevent icon changes)
        await applyIcon(exePath);
        
        signFile(exePath);
        console.log('✓ Custom signing completed');
      } catch (error) {
        console.error('✗ Custom signing failed:', error.message);
        console.error('Error stack:', error.stack);
        // Don't throw - let electron-builder continue even if custom signing fails
        // But log it clearly so user knows signing didn't happen
        console.error('⚠ WARNING: Executable was NOT signed!');
      }
    } else {
      console.log(`Skipping signing for non-executable file: ${exePath}`);
    }
  }
};

/**
 * Apply icon to executable using rcedit
 * This ensures the icon is applied even if electron-builder didn't do it
 */
async function applyIcon(exePath) {
  console.log(`\n=== Applying icon to executable ===`);
  console.log(`Executable path: ${exePath}`);
  
  // Ensure build directory and icon exist
  const buildDir = path.join(process.cwd(), 'build');
  const buildIconPath = path.join(buildDir, 'icon.ico');
  const sourceIconPath = path.join(process.cwd(), 'assets/icons/icon-white_s.ico');
  
  console.log(`Checking for icon at: ${buildIconPath}`);
  console.log(`Source icon at: ${sourceIconPath}`);
  
  // Copy icon to build directory if it doesn't exist
  if (!fs.existsSync(buildIconPath) && fs.existsSync(sourceIconPath)) {
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    fs.copyFileSync(sourceIconPath, buildIconPath);
    console.log(`✓ Copied icon to build directory: ${buildIconPath}`);
  }
  
  // Try multiple possible icon paths (use absolute paths)
  const possibleIconPaths = [
    path.resolve(buildIconPath),
    path.resolve(path.join(process.cwd(), 'build/icon.ico')),
    path.resolve(sourceIconPath),
    path.resolve(path.join(__dirname, '../build/icon.ico')),
    path.resolve(path.join(__dirname, '../../build/icon.ico')),
    buildIconPath,
    sourceIconPath
  ];
  
  let iconPath = null;
  for (const testPath of possibleIconPaths) {
    const absPath = path.isAbsolute(testPath) ? testPath : path.resolve(testPath);
    console.log(`Checking icon path: ${absPath} (exists: ${fs.existsSync(absPath)})`);
    if (fs.existsSync(absPath)) {
      iconPath = absPath;
      console.log(`✓ Found icon at: ${iconPath}`);
      break;
    }
  }
  
  if (!iconPath) {
    console.error('✗ Icon file not found in any expected location');
    console.error('Tried paths:');
    possibleIconPaths.forEach(p => console.error(`  - ${path.isAbsolute(p) ? p : path.resolve(p)}`));
    return;
  }
  
  // Ensure exePath is absolute
  const absoluteExePath = path.isAbsolute(exePath) ? exePath : path.resolve(exePath);
  if (!fs.existsSync(absoluteExePath)) {
    console.error(`✗ Executable not found: ${absoluteExePath}`);
    return;
  }
  
  // Try to use rcedit to apply the icon
  try {
    const rceditModule = require('rcedit');
    const rcedit = rceditModule.rcedit || rceditModule;
    console.log(`Applying icon to executable using rcedit...`);
    console.log(`  Executable: ${absoluteExePath}`);
    console.log(`  Icon: ${iconPath}`);
    
    // rcedit can be async, so handle both sync and async cases
    const result = rcedit(absoluteExePath, {
      icon: iconPath
    });
    
    // If it returns a promise, wait for it
    if (result && typeof result.then === 'function') {
      await result;
    }
    
    console.log('✓ Icon applied to executable successfully');
  } catch (error) {
    console.error(`✗ Could not apply icon via rcedit: ${error.message}`);
    console.error(`  Error details: ${error.stack || error}`);
    console.warn('The icon should have been applied by electron-builder during the build process');
  }
}

// Also export functions for direct use
module.exports.sign = signFile;
module.exports.verify = verifySignature;

