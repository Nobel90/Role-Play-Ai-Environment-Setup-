# PowerShell script to set up code signing environment for USB token
# This sets the CSC_NAME environment variable for the current PowerShell session

Write-Host "=== USB Token Code Signing Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check for code signing certificates
$certificates = Get-ChildItem -Path Cert:\CurrentUser\My -ErrorAction SilentlyContinue | Where-Object {
    $_.EnhancedKeyUsageList -match "Code Signing" -or 
    $_.EnhancedKeyUsageList -match "1.3.6.1.5.5.7.3.3"
}

if ($certificates.Count -eq 0) {
    Write-Host "⚠ No code signing certificates found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Cyan
    Write-Host "1. Your USB token is connected" -ForegroundColor White
    Write-Host "2. SafeNet Authentication Client is running (if using SafeNet)" -ForegroundColor White
    Write-Host "3. The certificate is accessible via Windows Certificate Store" -ForegroundColor White
    Write-Host ""
    Write-Host "Run .\setup-signing.ps1 for more help" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($certificates.Count) code signing certificate(s):" -ForegroundColor Green
Write-Host ""

$index = 1
$certList = @()
foreach ($cert in $certificates) {
    $certInfo = @{
        Index = $index
        Subject = $cert.Subject
        Thumbprint = $cert.Thumbprint
        HasPrivateKey = $cert.HasPrivateKey
    }
    $certList += $certInfo
    
    Write-Host "[$index] $($cert.Subject)" -ForegroundColor Cyan
    Write-Host "     Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
    Write-Host "     Has Private Key: $($cert.HasPrivateKey)" -ForegroundColor $(if ($cert.HasPrivateKey) { "Green" } else { "Red" })
    Write-Host ""
    $index++
}

# If only one certificate, use it automatically
if ($certificates.Count -eq 1) {
    $selectedCert = $certificates[0]
    Write-Host "Only one certificate found. Using it automatically." -ForegroundColor Green
} else {
    # Ask user to select
    Write-Host "Multiple certificates found. Please select one:" -ForegroundColor Yellow
    $selection = Read-Host "Enter number (1-$($certificates.Count))"
    
    try {
        $selectedIndex = [int]$selection - 1
        if ($selectedIndex -lt 0 -or $selectedIndex -ge $certificates.Count) {
            Write-Host "Invalid selection!" -ForegroundColor Red
            exit 1
        }
        $selectedCert = $certificates[$selectedIndex]
    } catch {
        Write-Host "Invalid input!" -ForegroundColor Red
        exit 1
    }
}

# Set environment variable using subject name (recommended)
$env:CSC_NAME = $selectedCert.Subject

Write-Host ""
Write-Host "✓ Environment variable set:" -ForegroundColor Green
Write-Host "  CSC_NAME = $($env:CSC_NAME)" -ForegroundColor Cyan
Write-Host ""
Write-Host "This setting is active for this PowerShell session only." -ForegroundColor Yellow
Write-Host ""
Write-Host "To make it permanent, add to your PowerShell profile:" -ForegroundColor Yellow
Write-Host '  $env:CSC_NAME = "' + $selectedCert.Subject + '"' -ForegroundColor Gray
Write-Host ""
Write-Host "Now you can build with signing:" -ForegroundColor Cyan
Write-Host "  npm run build:win" -ForegroundColor Green
Write-Host ""
Write-Host "Note: You will be prompted for your USB token PIN during signing." -ForegroundColor Yellow

