# ============================================================
# NEXUS AI Orchestrator — Setup Script (Windows/PowerShell)
# ============================================================
# Este script configura todo o ambiente necessário para rodar
# o sistema de orquestração multi-agente.
# ============================================================

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Step { param($msg) Write-Host "`n🔧 $msg" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red }

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║          NEXUS AI ORCHESTRATOR — SETUP                   ║
║          Sistema Multi-Agente Local                      ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# ---- Pré-requisitos ----
Write-Step "Verificando pré-requisitos..."

# Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-OK "Node.js encontrado: $nodeVersion"
} catch {
    Write-Fail "Node.js não encontrado. Instale em https://nodejs.org/"
    exit 1
}

# npm
try {
    $npmVersion = npm --version 2>$null
    Write-OK "npm encontrado: $npmVersion"
} catch {
    Write-Fail "npm não encontrado."
    exit 1
}

# Git
try {
    $gitVersion = git --version 2>$null
    Write-OK "Git encontrado: $gitVersion"
} catch {
    Write-Warn "Git não encontrado. Auto-config GitHub não funcionará."
}

# ---- Detectar IAs disponíveis ----
Write-Step "Detectando IAs locais..."

# Gemini CLI
try {
    $geminiCheck = gemini --version 2>$null
    Write-OK "Gemini CLI detectado: $geminiCheck"
} catch {
    Write-Warn "Gemini CLI não encontrado (opcional)"
}

# Claude Code
try {
    $claudeCheck = claude --version 2>$null
    Write-OK "Claude Code detectado: $claudeCheck"
} catch {
    Write-Warn "Claude Code não encontrado (opcional)"
}

# ChatGPT Desktop
$chatgptProcess = Get-Process -Name "ChatGPT" -ErrorAction SilentlyContinue
if ($chatgptProcess) {
    Write-OK "ChatGPT Desktop está rodando (PID: $($chatgptProcess.Id))"
} else {
    Write-Warn "ChatGPT Desktop não está rodando (opcional)"
}

# Ollama
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    $models = ($ollamaResponse.models | ForEach-Object { $_.name }) -join ", "
    Write-OK "Ollama detectado. Modelos: $models"
} catch {
    Write-Warn "Ollama não está rodando (opcional)"
}

# LM Studio
try {
    $lmResponse = Invoke-RestMethod -Uri "http://localhost:1234/v1/models" -TimeoutSec 3 -ErrorAction Stop
    Write-OK "LM Studio detectado"
} catch {
    Write-Warn "LM Studio não está rodando (opcional)"
}

# ---- Criar estrutura de diretórios ----
Write-Step "Verificando estrutura de diretórios..."

$dirs = @(
    "$ProjectRoot\shared-workspace\_inbox",
    "$ProjectRoot\shared-workspace\_outbox",
    "$ProjectRoot\shared-workspace\_status",
    "$ProjectRoot\shared-workspace\_logs",
    "$ProjectRoot\shared-workspace\_config"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-OK "Criado: $dir"
    } else {
        Write-OK "Existe: $dir"
    }
}

# ---- Instalar dependências ----
Write-Step "Instalando dependências do Orchestrator..."
Push-Location "$ProjectRoot\orchestrator"
if (Test-Path "package.json") {
    npm install 2>&1 | Out-Null
    Write-OK "Dependências do Orchestrator instaladas"
} else {
    Write-Warn "orchestrator/package.json não encontrado. Pule esta etapa."
}
Pop-Location

Write-Step "Instalando dependências do Dashboard..."
Push-Location "$ProjectRoot\dashboard"
if (Test-Path "package.json") {
    npm install 2>&1 | Out-Null
    Write-OK "Dependências do Dashboard instaladas"
} else {
    Write-Warn "dashboard/package.json não encontrado. Pule esta etapa."
}
Pop-Location

# ---- Criar .env se não existir ----
Write-Step "Verificando arquivo .env..."
$envFile = "$ProjectRoot\.env"
if (-not (Test-Path $envFile)) {
    @"
# NEXUS AI Orchestrator — Configuração de Ambiente
# Gerado automaticamente pelo setup.ps1

# Porta do Orchestrator API
ORCHESTRATOR_PORT=3001

# Porta do Dashboard (Vite dev server)
DASHBOARD_PORT=5173

# Pasta compartilhada (Blackboard)
SHARED_WORKSPACE_PATH=$ProjectRoot\shared-workspace

# Ollama
OLLAMA_HOST=http://localhost:11434

# LM Studio
LM_STUDIO_HOST=http://localhost:1234

# GitHub (opcional, para auto-config)
# GITHUB_TOKEN=ghp_xxxxx
# GITHUB_ORG=sua-organizacao
"@ | Set-Content -Path $envFile -Encoding UTF8
    Write-OK "Arquivo .env criado. Edite conforme necessário."
} else {
    Write-OK "Arquivo .env já existe"
}

# ---- Resumo ----
Write-Host @"

╔══════════════════════════════════════════════════════════╗
║                    SETUP COMPLETO! ✅                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Para iniciar o sistema:                                 ║
║    npm run start:orchestrator   (API na porta 3001)      ║
║    npm run start:dashboard      (UI na porta 5173)       ║
║                                                          ║
║  Ou inicie tudo de uma vez:                              ║
║    npm start                                             ║
║                                                          ║
║  Health check:                                           ║
║    npm run health-check                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
