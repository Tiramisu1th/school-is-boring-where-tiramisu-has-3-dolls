<#
    build_for_cpanel.ps1

    Purpose:
        - Build the Next.js frontend (exported static HTML) and assemble a minimal
            `out/` folder suitable for uploading to cPanel
        - Place built static site under `out/` and include only a whitelist of server files

    Safety & usage notes:
        - This script DOES NOT remove your local source files. It overwrites
            out/` and `out.tar.gz` in the repository root.
        - If you previously committed build outputs or node_modules to git, remove
            them from the index and add to .gitignore instead of including them here.

    Quick commands (run from repo root) — copy/paste into PowerShell:

        # 1) Check script syntax (will throw on parse errors)
        powershell -NoProfile -Command "try { [ScriptBlock]::Create((Get-Content -Raw '.\\build_for_cpanel.ps1')); Write-Host 'Syntax OK' } catch { Write-Error $_; exit 1 }"

        # 2) Run the build and packaging steps (will create out/ and out.tar.gz in repo root)
        .\build_for_cpanel.ps1

        # 3) Run the build with local dev mode (only supports live preview for frontend dev server, backend is NOT started by this script in -Localhost mode)
        .\build_for_cpanel.ps1 -l
        # 3a) Optionally specify a preferred port for localhost server
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
    [Alias('d')][switch]$Dev,
    [Alias('p')][int]$Port = 3120
)

Write-Host "Building frontend and packaging static files for cPanel..."

# YES, I AM CERTAIN THAT I WANT TO INCLUDE .env INTO THE OUT FOLDER (Tiramisu1th, 2026)
$RootWhitelist = @('.env', 'package.json', 'package-lock.json')

# Support shorthand `-lp 2526` or `-lp2526` by detecting it in the original command line
try {
    $invocationLine = $MyInvocation.Line
    if ($invocationLine -match "(?i)(?:^|\s)-lp\s*(\d+)(?:\s|$)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -lp; setting -Localhost and Port=$matchesPort"
        $Localhost = $true
        $Port = $matchesPort
    }
    elseif ($invocationLine -match "(?i)(?:^|\s)-lp(\d+)(?:\s|$)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -lp; setting -Localhost and Port=$matchesPort"
        $Localhost = $true
        $Port = $matchesPort
    }
    # support -lNNNN (e.g. -l1234) to set localhost + port
    if ($invocationLine -match "(?i)(?:^|\s)-l(\d+)(?:\s|$)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -lNNNN; setting -Localhost and Port=$matchesPort"
        $Localhost = $true
        $Port = $matchesPort
    }
    # support -dp or -pd combined (dev + port)
    if ($invocationLine -match "(?i)(?:^|\s)-dp\s*(\d+)(?:\s|$)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -dp; setting -Dev and Port=$matchesPort"
        $Dev = $true
        $Port = $matchesPort
    }
    elseif ($invocationLine -match "(?i)(?:^|\s)-dp(\d+)(?:\s|$)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -dp; setting -Dev and Port=$matchesPort"
        $Dev = $true
        $Port = $matchesPort
    }
    # support -dNNNN (e.g. -d1234) to set dev + port
    if ($invocationLine -match "(?i)(?:^|\s)-d(\d+)(?:\s|$)") {
        $matchesPort = [int]$matches[1]
        Write-Host "Detected combined flag -dNNNN; setting -Dev and Port=$matchesPort"
        $Dev = $true
        $Port = $matchesPort
    }
}
catch {
    # Non-fatal; continue with normal param handling
}

# Defines repo root and script directory for relative paths below
# Prefer $PSScriptRoot which is the script's folder when executed
$repoRoot = $PSScriptRoot


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


# Ensure the existence of BASE_URL
if (-not $env:BASE_URL) {
    Write-Host "Warning: BASE_URL not set in .env!!!!!"
    exit 1
}


# Ensure the existence of GLOBAL_PASSWORD
if (-not $env:GLOBAL_PASSWORD) {
    Write-Host "Warning: GLOBAL_PASSWORD not set in .env!!!!!"
    exit 1
}


# Always run npm install to ensure node_modules are up to date
Write-Host "Running npm install..."
npm install


# If Dev mode is active, ignore Localhost and start Next dev server
if ($Dev) {
    if ($Localhost) { Write-Host "-d/--dev specified: ignoring -l/--localhost" }

    # test if the port is in use; if so, increment and try again until we find a free port
    while ($true) {
        $test = Test-NetConnection -ComputerName '127.0.0.1' -Port $Port -InformationLevel Quiet
        if (-not $test) { break }
        Write-Host "Port $Port in use; trying $(++$Port)..."
    }

    $localUrl = "http://127.0.0.1:$Port"
    Write-Host "Dev mode: setting BASE_URL and NEXT_PUBLIC_BASE_URL to $localUrl"
    Set-Item -Path env:BASE_URL -Value $localUrl
    Set-Item -Path env:NEXT_PUBLIC_BASE_URL -Value $localUrl

    Write-Host "Starting Next.js dev server on port $Port"
    # Prefer invoking the local Next binary to ensure args are passed as flags and
    # not interpreted as a positional project directory.
    $nextCmd = Join-Path $repoRoot 'node_modules\.bin\next.cmd'
    if (Test-Path $nextCmd) {
        Write-Host "Launching local next: $nextCmd dev -p $Port"
        & $nextCmd 'dev' '-p' $Port
    }
    else {
        Write-Host "Local next not found; falling back to npm run dev -- -p $Port"
        npm run dev -- -p $Port
    }
    Write-Host "Dev server exited."
    exit 0
}


# if localhost mode, prepare and run Node using out/app.js after building
if ($Localhost) {
    # test if the port is in use; if so, increment and try again until we find a free port
    while ($true) {
        $test = Test-NetConnection -ComputerName '127.0.0.1' -Port $Port -InformationLevel Quiet
        if (-not $test) { break }
        Write-Host "Port $Port in use; trying $(++$Port)..."
    }

    # Overwrite BASE_URL and NEXT_PUBLIC_BASE_URL to localhost with the selected port for the local dev server
    $localUrl = "http://127.0.0.1:$Port"
    Write-Host "Localhost mode: setting BASE_URL and NEXT_PUBLIC_BASE_URL to $localUrl"
    Set-Item -Path env:BASE_URL -Value $localUrl
    Set-Item -Path env:NEXT_PUBLIC_BASE_URL -Value $localUrl

    # Build out/ folder with compiled frontend and whitelisted server files for deployment. 
    Write-Host "Running Next build (npm run build) ..."
    npm run build
    Write-Host "Running TypeScript compiler (npm run compile:ts) ..."
    npm run compile:ts
    Write-Host "Copying other necessary files to out/ ... "
    $outPath = Join-Path $repoRoot 'out'
    foreach ($name in $RootWhitelist) {
        $src = Join-Path $repoRoot $name
        $dst = Join-Path $outPath $name
        if (Test-Path $src) {
            Write-Host "Copying $name -> $dst"
            try { Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop }
            catch { Write-Error "Failed to copy $($src): $_" }
        }
        else { Write-Host "Skipping missing root file: $name" }
    }
    Write-Host "Writing 404.html to replace default 404 given by next export ... "
    Copy-Item -Path (Join-Path $repoRoot 'public\404.html') -Destination (Join-Path $outPath '404.html') -Force

    # Start Node using out/app.js as backend. Export PORT env var for the process.
    Set-Item -Path env:PORT -Value "$Port"
    $appJs = Join-Path $outPath 'app.js'
    if (-not (Test-Path $appJs)) { Write-Error "Cannot start Node: $appJs not found"; exit 1 }
    Write-Host "Starting Node backend: node $appJs on port $Port"
    node $appJs
    Write-Host "Node process exited."
    exit 0
}


# Build out/ folder with compiled frontend and whitelisted server files for deployment. 
Write-Host "Running Next build (npm run build) ..."
npm run build
Write-Host "Running TypeScript compiler (npm run compile:ts) ..."
npm run compile:ts
Write-Host "Copying other necessary files to out/ ... "
$outPath = Join-Path $repoRoot 'out'
foreach ($name in $RootWhitelist) {
    $src = Join-Path $repoRoot $name
    $dst = Join-Path $outPath $name
    if (Test-Path $src) {
        Write-Host "Copying $name -> $dst"
        try { Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop }
        catch { Write-Error "Failed to copy $($src): $_" }
    }
    else { Write-Host "Skipping missing root file: $name" }
}
Write-Host "Writing 404.html to replace default 404 given by next export ... "
Copy-Item -Path (Join-Path $repoRoot 'public\404.html') -Destination (Join-Path $outPath '404.html') -Force


# For packaging flow: also overwrites out.tar.gz in repo root
$archivePath = Join-Path $repoRoot 'out.tar.gz'
if (Test-Path $archivePath) { 
    Write-Host "Cleaning existing out.tar.gz archive at $archivePath"
    Remove-Item -Force $archivePath
}
Write-Host "Creating out.tar.gz ..."
if (Get-Command tar -ErrorAction SilentlyContinue) {
    # Use tar to create a gzipped archive of the deploy directory.
    & tar -czf $archivePath -C $outPath .
    if ($LASTEXITCODE -ne 0) { Write-Error "tar failed with exit code $LASTEXITCODE"; exit 1 }
    $finalArchive = $archivePath
}
else {
    Write-Error "'tar' is not available. Cannot create archive."
    exit 1
}

Write-Host "Packaging complete. Deploy folder: $deployDir"
Write-Host "Deploy archive: $finalArchive"

