# ============================================================
# NEXUS AI Orchestrator — Health Check
# ============================================================
# Verifica o status de todas as IAs e do sistema
# ============================================================

$ErrorActionPreference = "Continue"

function Write-Status {
    param($name, $status, $detail)
    $icon = if ($status -eq "online") { "🟢" } elseif ($status -eq "busy") { "🟡" } else { "🔴" }
    $color = if ($status -eq "online") { "Green" } elseif ($status -eq "busy") { "Yellow" } else { "Red" }
    Write-Host "  $icon $name" -ForegroundColor $color -NoNewline
    if ($detail) { Write-Host " — $detail" -ForegroundColor Gray } else { Write-Host "" }
}

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║          NEXUS AI — Health Check Report                   ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "  Timestamp: $timestamp" -ForegroundColor Gray
Write-Host ""

# ---- Sistema ----
Write-Host "  SISTEMA" -ForegroundColor White
Write-Host "  -------" -ForegroundColor DarkGray

# Orchestrator API
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Status "Orchestrator API" "online" "porta 3001"
} catch {
    Write-Status "Orchestrator API" "offline" "porta 3001 não responde"
}

# Dashboard
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    Write-Status "Dashboard" "online" "porta 5173"
} catch {
    Write-Status "Dashboard" "offline" "porta 5173 não responde"
}

Write-Host ""
Write-Host "  IAs LOCAIS" -ForegroundColor White
Write-Host "  ----------" -ForegroundColor DarkGray

# Gemini CLI
try {
    $geminiVersion = gemini --version 2>$null
    Write-Status "Gemini CLI" "online" $geminiVersion
} catch {
    Write-Status "Gemini CLI" "offline" "comando 'gemini' não encontrado"
}

# Claude Code
try {
    $claudeVersion = claude --version 2>$null
    Write-Status "Claude Code" "online" $claudeVersion
} catch {
    Write-Status "Claude Code" "offline" "comando 'claude' não encontrado"
}

# ChatGPT Desktop
$chatgptProcess = Get-Process -Name "ChatGPT" -ErrorAction SilentlyContinue
if ($chatgptProcess) {
    Write-Status "ChatGPT Desktop" "online" "PID: $($chatgptProcess.Id)"
} else {
    Write-Status "ChatGPT Desktop" "offline" "processo não encontrado"
}

# Ollama
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $modelCount = $ollamaResponse.models.Count
    $modelNames = ($ollamaResponse.models | ForEach-Object { $_.name }) -join ", "
    Write-Status "Ollama" "online" "$modelCount modelo(s): $modelNames"
} catch {
    Write-Status "Ollama" "offline" "porta 11434 não responde"
}

# LM Studio
try {
    $lmResponse = Invoke-RestMethod -Uri "http://localhost:1234/v1/models" -TimeoutSec 3 -ErrorAction Stop
    Write-Status "LM Studio" "online" "porta 1234"
} catch {
    Write-Status "LM Studio" "offline" "porta 1234 não responde"
}

Write-Host ""
Write-Host "  SHARED WORKSPACE" -ForegroundColor White
Write-Host "  ----------------" -ForegroundColor DarkGray

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$workspace = "$ProjectRoot\shared-workspace"

if (Test-Path $workspace) {
    $inboxCount = (Get-ChildItem "$workspace\_inbox\*.json" -ErrorAction SilentlyContinue).Count
    $outboxCount = (Get-ChildItem "$workspace\_outbox\*.json" -ErrorAction SilentlyContinue).Count
    $logCount = (Get-ChildItem "$workspace\_logs\*" -ErrorAction SilentlyContinue).Count
    
    Write-Host "  📥 Inbox:  $inboxCount tarefa(s) pendente(s)" -ForegroundColor Gray
    Write-Host "  📤 Outbox: $outboxCount resultado(s)" -ForegroundColor Gray
    Write-Host "  📋 Logs:   $logCount registro(s)" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Shared workspace não encontrado" -ForegroundColor Red
}

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║                Health Check Completo ✅                   ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
