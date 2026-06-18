# ============================================================
# NEXUS AI Orchestrator — Auto-Configuração GitHub
# ============================================================
# Este script cria e configura automaticamente um repositório
# GitHub completo com branches, labels, milestones, e proteções.
# Requer: GitHub CLI (gh) instalado e autenticado
# ============================================================

param(
    [string]$RepoName = "nexus-ai-orchestrator",
    [string]$Description = "Sistema multi-agente que orquestra Gemini CLI, Claude, ChatGPT e modelos locais",
    [string]$Visibility = "private",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n🔧 $msg" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red }

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║       NEXUS AI — Auto-Config GitHub Repository           ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# ---- Verificar GitHub CLI ----
Write-Step "Verificando GitHub CLI..."
try {
    $ghVersion = gh --version 2>$null | Select-Object -First 1
    Write-OK "GitHub CLI encontrado: $ghVersion"
} catch {
    Write-Fail "GitHub CLI (gh) não encontrado. Instale: https://cli.github.com/"
    exit 1
}

# Verificar autenticação
try {
    $ghAuth = gh auth status 2>&1
    Write-OK "GitHub CLI autenticado"
} catch {
    Write-Fail "GitHub CLI não autenticado. Execute: gh auth login"
    exit 1
}

if ($DryRun) {
    Write-Warn "MODO DRY-RUN: Nenhuma alteração será feita"
}

# ---- Inicializar Git local ----
Write-Step "Inicializando repositório Git local..."
Push-Location $ProjectRoot

if (-not (Test-Path ".git")) {
    if (-not $DryRun) {
        git init
        git add .
        git commit -m "feat: initial NEXUS AI Orchestrator setup"
    }
    Write-OK "Repositório Git local inicializado"
} else {
    Write-OK "Repositório Git já existe"
}

# ---- Criar repositório remoto ----
Write-Step "Criando repositório GitHub: $RepoName..."
if (-not $DryRun) {
    try {
        gh repo create $RepoName `
            --description $Description `
            --$Visibility `
            --source . `
            --remote origin `
            --push
        Write-OK "Repositório criado e código enviado"
    } catch {
        Write-Warn "Repositório pode já existir. Tentando vincular..."
        git remote add origin "https://github.com/$(gh api user -q .login)/$RepoName.git" 2>$null
        git push -u origin main 2>$null
    }
} else {
    Write-OK "[DRY-RUN] Criaria repositório: $RepoName ($Visibility)"
}

# ---- Criar branches ----
Write-Step "Configurando branches..."

$branches = @("develop", "staging")
foreach ($branch in $branches) {
    if (-not $DryRun) {
        git checkout -b $branch 2>$null
        git push -u origin $branch 2>$null
        Write-OK "Branch '$branch' criada"
    } else {
        Write-OK "[DRY-RUN] Criaria branch: $branch"
    }
}

# Voltar para main
if (-not $DryRun) { git checkout main 2>$null }

# ---- Criar Labels ----
Write-Step "Criando labels..."

$labels = @(
    @{ name = "agent:gemini"; color = "4285F4"; description = "Relacionado ao adapter Gemini CLI" },
    @{ name = "agent:claude"; color = "D97706"; description = "Relacionado ao adapter Claude" },
    @{ name = "agent:chatgpt"; color = "10A37F"; description = "Relacionado ao adapter ChatGPT" },
    @{ name = "agent:ollama"; color = "1A1A2E"; description = "Relacionado ao adapter Ollama" },
    @{ name = "component:orchestrator"; color = "6C63FF"; description = "Motor de orquestração" },
    @{ name = "component:dashboard"; color = "00D4AA"; description = "Dashboard visual" },
    @{ name = "component:prompts"; color = "FFD93D"; description = "Prompts mestras" },
    @{ name = "priority:critical"; color = "FF0000"; description = "Prioridade crítica" },
    @{ name = "priority:high"; color = "FF6B6B"; description = "Prioridade alta" },
    @{ name = "priority:medium"; color = "FFA500"; description = "Prioridade média" },
    @{ name = "priority:low"; color = "00CED1"; description = "Prioridade baixa" },
    @{ name = "type:feature"; color = "0E8A16"; description = "Nova funcionalidade" },
    @{ name = "type:bug"; color = "D73A4A"; description = "Correção de bug" },
    @{ name = "type:refactor"; color = "7057FF"; description = "Refatoração" },
    @{ name = "type:docs"; color = "0075CA"; description = "Documentação" }
)

foreach ($label in $labels) {
    if (-not $DryRun) {
        gh label create $label.name --color $label.color --description $label.description --force 2>$null
    }
    Write-OK "Label: $($label.name)"
}

# ---- Criar Milestones ----
Write-Step "Criando milestones..."

$milestones = @(
    @{ title = "v0.1 - MVP Core"; description = "Orchestrator engine + shared workspace funcionando" },
    @{ title = "v0.2 - Dashboard"; description = "Dashboard visual com monitoring em tempo real" },
    @{ title = "v0.3 - Multi-Agent"; description = "Integração completa com todas as IAs" },
    @{ title = "v1.0 - Production"; description = "Sistema estável para uso em produção" }
)

foreach ($ms in $milestones) {
    if (-not $DryRun) {
        gh api repos/{owner}/{repo}/milestones -f title="$($ms.title)" -f description="$($ms.description)" -f state="open" 2>$null
    }
    Write-OK "Milestone: $($ms.title)"
}

# ---- Criar Issue Templates ----
Write-Step "Criando templates de Issue e PR..."

$issueTemplate = @"
---
name: Feature Request
about: Sugerir nova funcionalidade para o NEXUS AI Orchestrator
title: '[FEATURE] '
labels: type:feature
assignees: ''
---

## Descrição
Descreva a funcionalidade desejada.

## Motivação
Por que esta funcionalidade é necessária?

## Componente Afetado
- [ ] Orchestrator Engine
- [ ] Dashboard
- [ ] Adapters (Gemini/Claude/ChatGPT/Ollama)
- [ ] Shared Workspace
- [ ] Prompts
- [ ] Scripts

## Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
"@

$bugTemplate = @"
---
name: Bug Report
about: Reportar um bug no sistema
title: '[BUG] '
labels: type:bug
assignees: ''
---

## Descrição do Bug
Descreva o bug encontrado.

## Passos para Reproduzir
1. Passo 1
2. Passo 2

## Comportamento Esperado
O que deveria acontecer?

## Comportamento Atual
O que está acontecendo?

## Ambiente
- OS: Windows
- Node.js: 
- IAs rodando:
"@

if (-not $DryRun) {
    $templateDir = "$ProjectRoot\.github\ISSUE_TEMPLATE"
    New-Item -ItemType Directory -Path $templateDir -Force | Out-Null
    $issueTemplate | Set-Content "$templateDir\feature_request.md" -Encoding UTF8
    $bugTemplate | Set-Content "$templateDir\bug_report.md" -Encoding UTF8
}
Write-OK "Templates de Issue criados"

# ---- Branch Protection ----
Write-Step "Configurando proteção de branch (main)..."
if (-not $DryRun) {
    gh api repos/{owner}/{repo}/branches/main/protection `
        -X PUT `
        -f "required_status_checks[strict]=true" `
        -f "required_status_checks[contexts][]=validate-agents" `
        -f "enforce_admins=false" `
        -f "required_pull_request_reviews[required_approving_review_count]=1" `
        -f "restrictions=null" 2>$null
    Write-OK "Branch main protegida"
} else {
    Write-OK "[DRY-RUN] Protegeria branch main"
}

Pop-Location

# ---- Resumo ----
Write-Host @"

╔══════════════════════════════════════════════════════════╗
║           GITHUB AUTO-CONFIG COMPLETO! ✅                ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Repositório: $RepoName
║  Branches: main, develop, staging                        ║
║  Labels: 15 labels criadas                               ║
║  Milestones: v0.1 → v1.0                                 ║
║  Templates: Feature Request, Bug Report                  ║
║  Proteção: main branch protegida                         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
