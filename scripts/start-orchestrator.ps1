# ============================================================
# NEXUS AI Orchestrator — Start Script
# ============================================================
# Inicia o Orchestrator e o Dashboard simultaneamente
# ============================================================

$ErrorActionPreference = "Continue"

# Garantir que o Node.js está no PATH
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $env:Path += ";C:\Program Files\nodejs"
}

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║          NEXUS AI ORCHESTRATOR — STARTING                ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Verificar se shared-workspace existe
$sharedWorkspace = "$ProjectRoot\shared-workspace"
if (-not (Test-Path $sharedWorkspace)) {
    Write-Host "⚠️  Shared workspace não encontrado. Execute setup.ps1 primeiro." -ForegroundColor Yellow
    exit 1
}

# Iniciar Orchestrator em background
Write-Host "🚀 Iniciando Orchestrator (porta 3001)..." -ForegroundColor Cyan
$orchestratorJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location "$path\orchestrator"
    npm start 2>&1
} -ArgumentList $ProjectRoot

# Aguardar um pouco para o orchestrator inicializar
Start-Sleep -Seconds 3

# Iniciar Dashboard em background
Write-Host "🎨 Iniciando Dashboard (porta 5173)..." -ForegroundColor Cyan
$dashboardJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location "$path\dashboard"
    npm run dev 2>&1
} -ArgumentList $ProjectRoot

Write-Host @"

✅ Sistema iniciado!

  📡 Orchestrator API: http://localhost:3001
  🖥️  Dashboard:        http://localhost:5173

  Pressione Ctrl+C para parar tudo.

"@ -ForegroundColor Green

# Manter rodando e mostrar logs
try {
    while ($true) {
        # Mostrar output dos jobs
        Receive-Job -Job $orchestratorJob -ErrorAction SilentlyContinue
        Receive-Job -Job $dashboardJob -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "`n🛑 Parando serviços..." -ForegroundColor Yellow
    Stop-Job -Job $orchestratorJob -ErrorAction SilentlyContinue
    Stop-Job -Job $dashboardJob -ErrorAction SilentlyContinue
    Remove-Job -Job $orchestratorJob -ErrorAction SilentlyContinue
    Remove-Job -Job $dashboardJob -ErrorAction SilentlyContinue
    Write-Host "✅ Serviços parados." -ForegroundColor Green
}
