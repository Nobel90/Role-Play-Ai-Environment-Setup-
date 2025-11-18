# PowerShell script to help set up code signing with SafeNet USB certificate
# Run this script in PowerShell (as Administrator if needed)

Write-Host "=== SafeNet USB Certificate Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if SafeNet Authentication Client is installed
Write-Host "Checking for SafeNet Authentication Client..." -ForegroundColor Yellow
$safenetPath = Get-Command "sftoken.exe" -ErrorAction SilentlyContinue
if ($safenetPath) {
    Write-Host "✓ SafeNet Authentication Client found" -ForegroundColor Green
} else {
    Write-Host "⚠ SafeNet Authentication Client not found in PATH" -ForegroundColor Yellow
    Write-Host "  Make sure SafeNet drivers are installed" -ForegroundColor Yellow
}

# Check if USB token is connected
Write-Host ""
Write-Host "Checking for USB token..." -ForegroundColor Yellow
try {
    $tokens = & sftoken.exe list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ USB token detected" -ForegroundColor Green
        Write-Host $tokens
    } else {
        Write-Host "⚠ Could not detect USB token" -ForegroundColor Yellow
        Write-Host "  Make sure the USB token is connected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check for USB token: $_" -ForegroundColor Yellow
}

# List code signing certificates
Write-Host ""
Write-Host "Searching for code signing certificates..." -ForegroundColor Yellow
Write-Host ""

$certificates = Get-ChildItem -Path Cert:\CurrentUser\My -ErrorAction SilentlyContinue | Where-Object {
    $_.EnhancedKeyUsageList -match "Code Signing" -or 
    $_.EnhancedKeyUsageList -match "1.3.6.1.5.5.7.3.3"
}

if ($certificates.Count -eq 0) {
    Write-Host "⚠ No code signing certificates found in Certificate Store" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Cyan
    Write-Host "1. Make sure your USB token is connected" -ForegroundColor White
    Write-Host "2. Open SafeNet Authentication Client and verify the certificate is visible" -ForegroundColor White
    Write-Host "3. The certificate might need to be imported to Windows Certificate Store" -ForegroundColor White
    Write-Host "4. Check if the certificate has code signing capability" -ForegroundColor White
} else {
    Write-Host "Found $($certificates.Count) code signing certificate(s):" -ForegroundColor Green
    Write-Host ""
    
    $index = 1
    foreach ($cert in $certificates) {
        Write-Host "[$index] Certificate Details:" -ForegroundColor Cyan
        Write-Host "    Subject: $($cert.Subject)" -ForegroundColor White
        Write-Host "    Issuer: $($cert.Issuer)" -ForegroundColor White
        Write-Host "    Thumbprint: $($cert.Thumbprint)" -ForegroundColor White
        Write-Host "    Valid From: $($cert.NotBefore)" -ForegroundColor White
        Write-Host "    Valid To: $($cert.NotAfter)" -ForegroundColor White
        Write-Host "    Has Private Key: $($cert.HasPrivateKey)" -ForegroundColor $(if ($cert.HasPrivateKey) { "Green" } else { "Red" })
        Write-Host ""
        $index++
    }
    
    # Suggest the first certificate
    $selectedCert = $certificates[0]
    Write-Host "=== Recommended Configuration ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To use the first certificate, set this environment variable:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host '  $env:CSC_NAME = "' + $selectedCert.Subject + '"' -ForegroundColor Green
    Write-Host ""
    Write-Host "Or use the thumbprint:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host '  $env:CSC_NAME = "' + $selectedCert.Thumbprint + '"' -ForegroundColor Green
    Write-Host ""
    Write-Host "Then build with:" -ForegroundColor Yellow
    Write-Host "  npm run build:win" -ForegroundColor Green
    Write-Host ""
    
    # Check if signtool is available
    Write-Host "Checking for signtool.exe..." -ForegroundColor Yellow
    $signtool = Get-Command "signtool.exe" -ErrorAction SilentlyContinue
    if ($signtool) {
        Write-Host "✓ signtool.exe found at: $($signtool.Source)" -ForegroundColor Green
    } else {
        Write-Host "⚠ signtool.exe not found in PATH" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You need to install Windows SDK or Visual Studio Build Tools" -ForegroundColor Yellow
        Write-Host "Download from: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Or add signtool to PATH manually:" -ForegroundColor Yellow
        Write-Host '  $env:PATH += ";C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64"' -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan

