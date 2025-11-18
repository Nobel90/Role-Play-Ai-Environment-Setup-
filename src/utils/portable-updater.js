/**
 * Custom Portable Updater
 * Handles update checking and downloading for portable builds
 * Since portable builds can't auto-update, we download the new version
 * and prompt the user to replace it manually
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const GITHUB_OWNER = 'Nobel90';
const GITHUB_REPO = 'Role-Play-Ai-Environment-Setup-';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/**
 * Get current app version from package.json
 */
function getCurrentVersion() {
  try {
    // In packaged app, package.json is inside app.asar
    // We can read it directly using fs (asar supports this)
    let packagePath;
    
    if (app.isPackaged) {
      // In packaged app, try reading from app.asar
      packagePath = path.join(process.resourcesPath, 'app.asar', 'package.json');
    } else {
      // In development, read from project root
      packagePath = path.join(__dirname, '../../package.json');
    }
    
    // Read package.json (works with asar archives)
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);
    // Fallback: return a default version
    return '0.0.0';
  }
}

/**
 * Compare two version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

/**
 * Check for updates from GitHub releases
 */
async function checkForUpdates() {
  return new Promise((resolve, reject) => {
    const url = new URL(GITHUB_API_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'VRC-Character-Updater',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error('GitHub API error:', res.statusCode, data);
            reject(new Error(`GitHub API returned status ${res.statusCode}: ${data.substring(0, 200)}`));
            return;
          }

          const release = JSON.parse(data);
          console.log('GitHub release data:', {
            tag_name: release.tag_name,
            name: release.name,
            assets_count: release.assets ? release.assets.length : 0
          });
          
          const latestVersion = release.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
          const currentVersion = getCurrentVersion();
          
          console.log('Version comparison:', {
            current: currentVersion,
            latest: latestVersion,
            comparison: compareVersions(latestVersion, currentVersion)
          });

          const updateInfo = {
            currentVersion,
            latestVersion,
            hasUpdate: compareVersions(latestVersion, currentVersion) > 0,
            releaseNotes: release.body || '',
            releaseUrl: release.html_url,
            assets: release.assets || []
          };

          // Find the portable executable asset
          const portableAsset = release.assets.find(asset => 
            asset.name.includes('portable') && asset.name.endsWith('.exe')
          );
          
          console.log('Portable asset found:', portableAsset ? portableAsset.name : 'None');

          if (updateInfo.hasUpdate && portableAsset) {
            updateInfo.downloadUrl = portableAsset.browser_download_url;
            updateInfo.downloadSize = portableAsset.size;
            updateInfo.fileName = portableAsset.name;
          } else if (updateInfo.hasUpdate && !portableAsset) {
            console.warn('Update available but no portable asset found');
          }

          resolve(updateInfo);
        } catch (error) {
          console.error('Parse error:', error, 'Data:', data.substring(0, 500));
          reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Failed to check for updates: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Update check timeout'));
    });

    req.end();
  });
}

/**
 * Download the update file (with redirect support)
 */
async function downloadUpdate(downloadUrl, onProgress, redirectCount = 0, originalFileName = null) {
  return new Promise((resolve, reject) => {
    // Prevent infinite redirect loops
    if (redirectCount > 5) {
      reject(new Error('Too many redirects'));
      return;
    }

    const url = new URL(downloadUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'VRC-Character-Updater',
        'Accept': '*/*'
      }
    };

    const req = protocol.request(options, (res) => {
      // Handle redirects (301, 302, 307, 308)
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        const redirectUrl = res.headers.location;
        if (!redirectUrl) {
          reject(new Error(`Redirect received but no location header (status ${res.statusCode})`));
          return;
        }
        
        // Resolve relative redirects
        const absoluteRedirectUrl = redirectUrl.startsWith('http') 
          ? redirectUrl 
          : `${url.protocol}//${url.hostname}${redirectUrl}`;
        
        console.log(`Following redirect ${redirectCount + 1} to: ${absoluteRedirectUrl}`);
        
        // Preserve the original filename from the first URL
        const preservedFileName = originalFileName || path.basename(url.pathname);
        
        // Follow the redirect
        return downloadUpdate(absoluteRedirectUrl, onProgress, redirectCount + 1, preservedFileName)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Download failed with status ${res.statusCode}`));
        return;
      }

      const totalSize = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      
      // Save to user's Downloads folder
      const downloadsPath = app.getPath('downloads');
      
      // Use original filename if available, otherwise try to extract from current URL
      // If that fails, try to get from Content-Disposition header
      let fileName = originalFileName || path.basename(url.pathname);
      
      // Try to extract filename from Content-Disposition header if available
      const contentDisposition = res.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1].replace(/['"]/g, '');
          // Decode URL-encoded filename if needed
          try {
            fileName = decodeURIComponent(fileName);
          } catch (e) {
            // If decoding fails, use as-is
          }
        }
      }
      
      // If we still don't have a proper filename with extension, use the original from GitHub API
      if (!fileName || !fileName.includes('.') || fileName.length < 5) {
        // Fallback: use the original filename from the updateInfo if available
        // This will be passed from the main process
        fileName = originalFileName || 'VRC-Character-Updater-update.exe';
      }
      
      const filePath = path.join(downloadsPath, fileName);

      const fileStream = fs.createWriteStream(filePath);

      res.on('data', (chunk) => {
        downloadedSize += chunk.length;
        fileStream.write(chunk);
        
        if (onProgress && totalSize > 0) {
          const percent = Math.round((downloadedSize / totalSize) * 100);
          onProgress({
            percent,
            transferred: downloadedSize,
            total: totalSize
          });
        }
      });

      res.on('end', () => {
        fileStream.end();
        resolve({
          filePath,
          fileName,
          totalSize: downloadedSize
        });
      });

      fileStream.on('error', (error) => {
        reject(new Error(`Failed to write file: ${error.message}`));
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Download failed: ${error.message}`));
    });

    req.setTimeout(300000, () => { // 5 minute timeout
      req.destroy();
      reject(new Error('Download timeout'));
    });

    req.end();
  });
}

/**
 * Install update and restart the application
 * Creates a Node.js helper script that runs after the app quits
 * Uses the bundled Node.js runtime from Electron
 */
function installAndRestart(newExePath, oldExePath) {
  const os = require('os');
  const { spawn } = require('child_process');
  
  // Create a temporary Node.js script that will handle the update
  const scriptPath = path.join(os.tmpdir(), `vrc-updater-${Date.now()}.js`);
  
  // Get the process name (without .exe extension) for checking if it's still running
  const processName = path.basename(oldExePath, '.exe');
  
  // Find Node.js executable - use the bundled one from Electron
  let nodeExecutable = null;
  
  if (app.isPackaged) {
    // In packaged app, use the bundled Node.js from Electron resources
    // Node.js is bundled in extraResources as node.exe
    const electronPath = process.execPath;
    const electronDir = path.dirname(electronPath);
    
    // Try to find node.exe in the Electron resources
    // For portable builds, extraResources are in the same directory as the exe
    const possibleNodePaths = [
      path.join(electronDir, 'resources', 'node.exe'),  // extraResources location
      path.join(process.resourcesPath, 'node.exe'),     // Alternative resources path
      path.join(electronDir, 'node.exe'),               // Same directory as exe
      path.join(process.resourcesPath, 'app.asar.unpacked', 'node.exe')
    ];
    
    for (const nodePath of possibleNodePaths) {
      if (fs.existsSync(nodePath)) {
        nodeExecutable = nodePath;
        console.log(`Found bundled Node.js at: ${nodeExecutable}`);
        break;
      }
    }
    
    // If still not found, log warning
    if (!nodeExecutable) {
      console.warn('Node.js not found in expected locations. Will try system Node.js as fallback.');
    }
  } else {
    // In development, use system Node.js
    try {
      const { execSync } = require('child_process');
      const nodePath = execSync('where node', { 
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim().split('\n')[0];
      if (nodePath && fs.existsSync(nodePath)) {
        nodeExecutable = nodePath;
      }
    } catch (e) {
      // Node.js not found
    }
  }
  
  if (!nodeExecutable) {
    throw new Error('Node.js runtime not found. The application requires Node.js to be bundled or installed.');
  }
  
  // Create the helper script content
  const scriptContent = `
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { execSync } = require('child_process');

const newExePath = ${JSON.stringify(newExePath)};
const oldExePath = ${JSON.stringify(oldExePath)};
const processName = ${JSON.stringify(processName)};
const scriptPath = __filename;

// Log file for debugging
const logFile = path.join(require('os').tmpdir(), \`vrc-updater-\${Date.now()}.log\`);

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] \${message}\\n\`;
  try {
    fs.appendFileSync(logFile, logMessage, 'utf8');
  } catch (e) {
    // Ignore log errors
  }
  console.log(message);
}

// Function to check if process is still running (Windows)
function isProcessRunning(name) {
  try {
    const result = execSync(\`tasklist /FI "IMAGENAME eq \${name}.exe" /FO CSV /NH\`, { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return result.trim().toLowerCase().includes(name.toLowerCase());
  } catch (e) {
    return false;
  }
}

// Function to wait for process to exit
function waitForExit(maxWait = 30) {
  return new Promise((resolve) => {
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      const isRunning = isProcessRunning(processName);
      log(\`Checking process status (attempt \${counter}/\${maxWait}): \${isRunning ? 'running' : 'stopped'}\`);
      
      if (!isRunning || counter >= maxWait) {
        clearInterval(interval);
        log('Process stopped, waiting 2 seconds for file handles to release...');
        setTimeout(resolve, 2000);
      }
    }, 1000);
  });
}

// Main update process
async function performUpdate() {
  try {
    log('=== Update Process Started ===');
    log(\`New executable: \${newExePath}\`);
    log(\`Old executable: \${oldExePath}\`);
    log(\`Process name: \${processName}\`);
    
    // Verify new executable exists
    if (!fs.existsSync(newExePath)) {
      log(\`ERROR: New executable not found: \${newExePath}\`);
      process.exit(1);
      return;
    }
    
    log('Waiting for application to close...');
    await waitForExit();
    
    // Normalize paths
    const normalizedOldPath = path.resolve(oldExePath);
    const normalizedNewPath = path.resolve(newExePath);
    
    // Safety check
    if (normalizedOldPath.toLowerCase() === normalizedNewPath.toLowerCase()) {
      log(\`ERROR: Old and new executable paths are the same: \${normalizedOldPath}\`);
      process.exit(1);
      return;
    }
    
    log('Replacing old executable...');
    
    // Delete the old executable
    if (fs.existsSync(normalizedOldPath)) {
      try {
        log(\`Deleting OLD executable: \${normalizedOldPath}\`);
        fs.unlinkSync(normalizedOldPath);
        if (fs.existsSync(normalizedOldPath)) {
          await new Promise(r => setTimeout(r, 1000));
          fs.unlinkSync(normalizedOldPath);
        }
        log('✓ Old executable deleted successfully');
      } catch (e) {
        log(\`First deletion failed: \${e.message}, retrying...\`);
        await new Promise(r => setTimeout(r, 2000));
        try {
          fs.unlinkSync(normalizedOldPath);
          log('✓ Old executable deleted on retry');
        } catch (e2) {
          log(\`ERROR: Failed to delete old executable: \${e2.message}\`);
          throw e2;
        }
      }
    }
    
    // Verify old executable is gone
    if (fs.existsSync(normalizedOldPath)) {
      log(\`ERROR: Old executable still exists\`);
      process.exit(1);
      return;
    }
    
    // Copy the new executable
    log(\`Copying NEW executable from \${normalizedNewPath} to \${normalizedOldPath}\`);
    fs.copyFileSync(normalizedNewPath, normalizedOldPath);
    log('✓ Copy completed');
    
    // Verify the copy
    if (!fs.existsSync(normalizedOldPath)) {
      log(\`ERROR: Copied executable not found\`);
      process.exit(1);
      return;
    }
    
    log('✓ Update installed successfully!');
    
    // Launch the new executable
    log(\`Launching new executable: \${normalizedOldPath}\`);
    const child = spawn(normalizedOldPath, [], {
      detached: true,
      stdio: 'ignore',
      shell: false
    });
    
    child.on('error', (error) => {
      log(\`ERROR: Failed to launch: \${error.message}\`);
      // Try alternative method
      try {
        const altChild = spawn('cmd.exe', ['/c', 'start', '""', \`"\${normalizedOldPath}"\`], {
          detached: true,
          stdio: 'ignore'
        });
        altChild.unref();
        log('Alternative launch method used');
      } catch (altError) {
        log(\`ERROR: Alternative launch also failed: \${altError.message}\`);
      }
    });
    
    child.unref();
    log('New executable launch completed');
    log('=== Update Process Completed Successfully ===');
  } catch (error) {
    log(\`ERROR: Update failed: \${error.message}\`);
    log(\`Stack: \${error.stack}\`);
    process.exit(1);
  } finally {
    setTimeout(() => {
      try {
        fs.unlinkSync(scriptPath);
      } catch (e) {
        // Ignore
      }
    }, 5000);
  }
}

performUpdate();
`;

  // Write the script to disk
  fs.writeFileSync(scriptPath, scriptContent, 'utf8');
  
  // Launch the script
  // If using Electron executable, we need to use --eval or a different approach
  if (nodeExecutable.endsWith('.exe') && !nodeExecutable.includes('node.exe')) {
    // Using Electron executable - need to execute JavaScript differently
    // For now, try to find node.exe in the same directory
    const electronDir = path.dirname(nodeExecutable);
    const nodeInDir = path.join(electronDir, 'node.exe');
    if (fs.existsSync(nodeInDir)) {
      nodeExecutable = nodeInDir;
    } else {
      // Fallback: use Electron with --eval (but this won't work for our script)
      // Better to throw an error and ask user to ensure Node.js is bundled
      throw new Error('Node.js runtime not found in Electron resources. Please ensure Node.js is bundled with the application.');
    }
  }
  
  const child = spawn(nodeExecutable, [scriptPath], {
    detached: true,
    stdio: 'ignore',
    windowsVerbatimArguments: false
  });
  
  child.unref();
  
  return { success: true, scriptPath };
}

module.exports = {
  checkForUpdates,
  downloadUpdate,
  getCurrentVersion,
  compareVersions,
  installAndRestart
};

