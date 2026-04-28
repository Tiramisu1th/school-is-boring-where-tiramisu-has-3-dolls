<#
    build_for_cpanel.ps1

    Purpose:
        - Build the Next.js frontend (exported static HTML) and assemble a minimal
            `deploy/` folder suitable for uploading to cPanel/public_html.
        - Place built static site under `deploy/webpage/` and include only a
            whitelist of server files (WSGI entry, server scripts, .htaccess, etc.).

    Safety & usage notes:
        - This script DOES NOT remove your local source files. It creates/overwrites
            `website/deploy/` and `deploy.tar.gz` in the repository root.
        - If you previously committed build outputs or node_modules to git, remove
            them from the index and add to .gitignore instead of including them here.

    Quick commands (run from repo root) — copy/paste into PowerShell:

        # 1) Check script syntax (will throw on parse errors)
        powershell -NoProfile -Command "try { [ScriptBlock]::Create((Get-Content -Raw '.\\build_for_cpanel.ps1')); Write-Host 'Syntax OK' } catch { Write-Error $_; exit 1 }"

        # 2) Run the build and packaging steps (will create deploy/ and deploy.tar.gz in repo root)
        .\build_for_cpanel.ps1

        # 3) Run the build with localhost/dev server mode (starts frontend dev server on available port, expects backend on 3120)
        .\build_for_cpanel.ps1 -l
        # 3a) Optionally specify a preferred port for the frontend dev server (will increment if in-use, but will skip 3120 which is reserved for the backend)
        .\build_for_cpanel.ps1 -l -p [port] or .\build_for_cpanel.ps1 -lp [port]

    Editing tips / remember to pay attention to syntax:
        - Keep matching braces `{}` and parentheses `()` balanced.
        - When adding multi-line strings use a here-string: @" ... "@ and close it on its own line.
        - Avoid using em-dashes or other special characters in the script, as they may cause syntax errors.
        - keyword else must be on the same line as the closing brace of the preceding if block, otherwise it will cause a syntax error.
        - Update this comment block AND the inline comments when making changes to ensure future maintainers understand the purpose and safety notes.

    The rest of this file performs the build and packaging steps. Comments inline
    explain each block. Do not remove the `Compress-Archive` call unless you
    intentionally change the packaging behavior.
#>

param(
    [Alias('l')][switch]$Localhost,
    [Alias('p')][int]$Port = 2526
)

Write-Host "Building frontend and packaging static files for cPanel..."

# YES, I AM CERTAIN THAT I WANT TO INCLUDE .env INTO THE OUT FOLDER (Tiramisu1th, 2026)
$RootWhitelist = @('app.js', 'package.json', 'package-lock.json')

# Support shorthand `-lp 2526` or `-lp2526` by detecting it in the original command line
try {
    $invocationLine = $MyInvocation.Line
    if ($invocationLine -match "(?i)-lp\s*(\d+)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -lp; setting -Localhost and Port=$matchesPort"
        $Localhost = $true
        $Port = $matchesPort
    }
    elseif ($invocationLine -match "(?i)-lp(\d+)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -lp; setting -Localhost and Port=$matchesPort"
        $Localhost = $true
        $Port = $matchesPort
    }
}
catch {
    # Non-fatal; continue with normal param handling
}

# Defines repo root and script directory for relative paths below
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition


# Load environment variables from repo root .env so build-time vars like INTERNAL_API_BASE are available
$envFile = Join-Path $repoRoot '.env'
Write-Host "Loading environment variables from: $envFile"
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq '' -or $line.StartsWith('#')) { return }
    if ($line -notmatch '=') { return }
    $parts = $line -split '=', 2
    $k = $parts[0].Trim()
    $v = $parts[1].Trim()
    # remove surrounding quotes if present
    if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
    if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length - 2) }
    Write-Host "Exporting env: $k"
    Set-Item -Path env:$k -Value $v
}
if ($env:BASE_URL) { 
    Write-Host "BASE_URL=${env:BASE_URL}" 
}
else {
    Write-Host "Warning: BASE_URL not set in .env!!!!!"
    exit 1
}

# Always run npm install to ensure noode_modules are up to date
Write-Host "Running npm install..."
npm install

# If the script was invoked with -Localhost (or -l), run a dev server
if ($Localhost) {
    # Localhost/dev mode: intentionally start only the frontend dev server.
    # The backend is NOT started by this script in -Localhost mode


    # Determine frontend port: prefer provided $Port, default to 2526, increment if in-use
    $preferred = if ($Port -and [int]$Port -ne 3120) { [int]$Port } else { 2526 }
    $frontendPort = $preferred
    while ($true) {
        # Skip backend port 3120
        if ($frontendPort -eq 3120) { $frontendPort++ ; continue }
        $test = Test-NetConnection -ComputerName '127.0.0.1' -Port $frontendPort -InformationLevel Quiet
        if (-not $test) { break }
        Write-Host "Port $frontendPort in use; trying $($frontendPort + 1)"
        $frontendPort++
    }

    # Ensure frontend build/dev uses local backend URL at build time
    Write-Host "Starting frontend dev server on port $frontendPort"
    Set-Item -Path env:NEXT_PUBLIC_PORT -Value "$frontendPort"
    
    # Start the Next.js dev server (will block until exited)
    npx next dev -p $frontendPort
    Write-Host "Dev server exited."
    exit 0
}

# First of all, clean the content of out/ folder and out.tar.gz if they exists
$outDir = Join-Path $scriptDir 'out'
$archivePath = Join-Path $repoRoot 'out.tar.gz'

if (Test-Path $outDir) {
    Write-Host "Cleaning existing out/ folder at $outDir"
    Remove-Item -Path $outDir -Recurse -Force
}

if (Test-Path $archivePath) { 
    Write-Host "Cleaning existing out.tar.gz archive at $archivePath"
    Remove-Item -Force $archivePath
}

# run the build and export steps to generate static HTML in `out/`
Write-Host "Running npm run build..."
npm run build

# Read INTERNAL_API_BASE from env and use Set-Item
Set-Item -Path env:NEXT_PUBLIC_BASE_URL -Value $env:BASE_URL
Set-Item -Path env:NEXT_PUBLIC_DUMP_PASSWORD -Value $env:DUMP_PASSWORD


Write-Host "Preparing copying other relevant files into: $scriptDir\out"
# Just denote the out/ because it has been handled in npm run build before
$deployDir = Join-Path $scriptDir 'out'


# Copy whitelisted root files if they exist, otherwise log that they're missing but continue
# other files inside src/ are handled separately
foreach ($name in $RootWhitelist) {
    $srcPath = Join-Path $scriptDir $name
    if (Test-Path $srcPath) {
        Write-Host "Including: $name from $srcPath"
        Copy-Item -Path $srcPath -Destination (Join-Path $deployDir $name) -Recurse -Force
    }
    else {
        Write-Host "Skipping missing root file: $name"
    }
}


# Create out.tar.gz in the repo root, containing the contents of the deploy folder

# archive file has been removed above
Write-Host "Creating $archivePath from $deployDir..."
if (Get-Command tar -ErrorAction SilentlyContinue) {
    # Use tar to create a gzipped archive of the deploy directory.
    & tar -czf $archivePath -C $deployDir .
    if ($LASTEXITCODE -ne 0) { Write-Error "tar failed with exit code $LASTEXITCODE"; exit 1 }
    $finalArchive = $archivePath
}
else {
    Write-Error "'tar' is not available. Cannot create archive."
    exit 1
}

Write-Host "Packaging complete. Deploy folder: $deployDir"
Write-Host "Deploy archive: $finalArchive"

