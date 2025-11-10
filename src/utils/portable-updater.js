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

module.exports = {
  checkForUpdates,
  downloadUpdate,
  getCurrentVersion,
  compareVersions
};

