param(
    [switch]$NoInstall,
    [string]$FrontendDir = "frontend",
    [string]$TargetRoot,
    [switch]$CreateZip
)

Write-Host "Building frontend and packaging static files for cPanel (root)..."

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $TargetRoot) { $TargetRoot = Join-Path $scriptDir 'deploy' }

# Ensure target root exists and is a clean deploy folder
if (-not (Test-Path -LiteralPath $TargetRoot)) {
    New-Item -ItemType Directory -Path $TargetRoot | Out-Null
}

# Remove previous deploy contents to avoid stale files
Get-ChildItem -Path $TargetRoot -Force | ForEach-Object {
    if ($_.Name -ne '.' -and $_.Name -ne '..') {
        Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$frontendPath = Join-Path $scriptDir $FrontendDir
if (-not (Test-Path -LiteralPath $frontendPath)) {
    Write-Host "ERROR: frontend folder not found at: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "Using frontend path: $frontendPath"

try {
    Push-Location -LiteralPath $frontendPath

    if (-not $NoInstall) {
        Write-Host "Running npm install in frontend..."
        npm install
    }

    Write-Host "Running npm run build..."
    npm run build

    # If `out` doesn't exist, try `npm run export` (uses `next export`)
    $outPath = Join-Path $frontendPath 'out'
    if (-not (Test-Path -LiteralPath $outPath)) {
        Write-Host "Exporting static HTML with npm run export..."
        npm run export
    }

    if (-not (Test-Path -LiteralPath $outPath)) {
        Write-Host "ERROR: export directory not found after build/export: $outPath" -ForegroundColor Red
        exit 2
    }

}
catch {
    Write-Host "Build failed: $_" -ForegroundColor Red
    exit 3
}
finally {
    Pop-Location
}

Write-Host "Copying exported files into deploy folder: $TargetRoot"

$sourceDir = Join-Path $frontendPath 'out'
Get-ChildItem -Path $sourceDir -Force | ForEach-Object {
    $dest = Join-Path $TargetRoot $_.Name
    if ($_.PSIsContainer) {
        Write-Host "Copying folder: $($_.Name)"
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    }
    else {
        Write-Host "Copying file: $($_.Name)"
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

# Also copy top-level assets/ folder into deploy so favicons and other assets are available at /assets
$repoAssets = Join-Path $scriptDir 'assets'
if (Test-Path -LiteralPath $repoAssets) {
    Write-Host "Copying project assets to deploy/assets..."
    $destAssets = Join-Path $TargetRoot 'assets'
    if (Test-Path $destAssets) { Remove-Item -Recurse -Force $destAssets }
    Copy-Item -Path $repoAssets -Destination $destAssets -Recurse -Force
}

# Ensure .htaccess with rewrite rules exists at target root for SPA routing
$htPath = Join-Path $TargetRoot '.htaccess'
$htContent = @"
Options -Indexes -MultiViews
DirectoryIndex index.html

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # If the request matches an existing file or directory, serve it
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Redirect /index or /index.html -> /
    RewriteRule ^index(?:\.html)?$ / [R=301,L]

    # If request has no extension and /<path>.html exists, serve it
    RewriteCond %{REQUEST_URI} !\.[^/]+$
    RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}.html -f
    RewriteRule ^ %{REQUEST_URI}.html [L]

    # Avoid loop when serving the 404 page itself
    RewriteCond %{REQUEST_URI} !^/404\.html$
    # Otherwise return the static 404 page with HTTP 404
    RewriteRule ^ /404.html [L,R=404]
</IfModule>
"@

Set-Content -LiteralPath $htPath -Value $htContent -Encoding UTF8

Write-Host "Packaging complete. Deploy folder created at: $TargetRoot" -ForegroundColor Green

if ($CreateZip) {
    $zipPath = Join-Path $scriptDir 'deploy.zip'
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Write-Host "Creating ZIP archive: $zipPath"
    Compress-Archive -Path (Join-Path $TargetRoot '*') -DestinationPath $zipPath -Force
    Write-Host "ZIP created: $zipPath" -ForegroundColor Green
}

Write-Host "Upload the contents of $TargetRoot (or deploy.zip) to your cPanel public_html." -ForegroundColor Yellow