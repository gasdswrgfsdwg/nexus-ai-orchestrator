# NEXUS AI Orchestrator

<div align="center">

![NEXUS AI](https://img.shields.io/badge/NEXUS-AI%20Orchestrator-6C63FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNy45M2MtMy45NS0uNDktNy0zLjg1LTctNy45MyAwLS42Mi4wOC0xLjIxLjIxLTEuNzlMOSAxNXY1Ljkzem02LjktMi41NEM2LjE4IDE5LjE5IDUgMTcuMjcgNSAxNWgyYTMgMyAwIDAgMCAzIDNoMXYtNi41N2wtNS4wMy01LjAzQzguNzcgNC45NCAxMC4zNiA0IDEyIDRjNC40MiAwIDggMy41OCA4IDhsLTQuMTgtLjAxTDE3LjkgMTcuMzl6Ii8+PC9zdmc+)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-00D4AA?style=for-the-badge)

**Sistema multi-agente que orquestra Gemini CLI, Claude, ChatGPT e modelos locais através de uma pasta compartilhada (Blackboard Pattern)**

[Dashboard](#dashboard) • [Início Rápido](#início-rápido) • [Arquitetura](#arquitetura) • [Prompts](#prompts)

</div>

---

## 🌟 Visão Geral

O NEXUS AI Orchestrator é um sistema que permite usar **múltiplas IAs simultaneamente**, coordenando-as através de uma pasta compartilhada inteligente. Ele detecta automaticamente quais IAs estão rodando no seu computador e distribui tarefas baseado nas capacidades de cada uma.

### IAs Suportadas

| IA | Tipo | Status |
|:---|:-----|:-------|
| 🔵 **Gemini CLI** | Cloud via CLI | ✅ Suportado |
| 🟠 **Claude Code** | Cloud via CLI | ✅ Suportado |
| 🟢 **ChatGPT Desktop** | Cloud via App | ✅ Suportado |
| ⚫ **Ollama** | Local | ✅ Suportado |
| 🟣 **LM Studio** | Local | ✅ Suportado |

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+
- npm 9+
- Pelo menos uma IA local instalada

### Instalação

```powershell
# 1. Clone ou navegue até o projeto
cd nexus-ai-orchestrator

# 2. Execute o setup (detecta IAs, instala dependências)
.\scripts\setup.ps1

# 3. Inicie o sistema
.\scripts\start-orchestrator.ps1
```

O **Dashboard** estará disponível em `http://localhost:5173` e a **API** em `http://localhost:3001`.

### Health Check

```powershell
.\scripts\health-check.ps1
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   DASHBOARD                      │
│              (React + Vite :5173)                 │
└──────────────────────┬──────────────────────────┘
                       │ WebSocket + REST
┌──────────────────────▼──────────────────────────┐
│              ORCHESTRATOR ENGINE                  │
│               (Node.js :3001)                     │
│  ┌───────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Dispatcher│ │ Registry │ │ Health Monitor│    │
│  └─────┬─────┘ └────┬─────┘ └───────┬───────┘   │
└────────┼────────────┼───────────────┼────────────┘
         │            │               │
┌────────▼────────────▼───────────────▼────────────┐
│            SHARED WORKSPACE (Blackboard)          │
│  ┌─────────┐ ┌────────┐ ┌───────┐ ┌──────┐      │
│  │ _inbox/ │ │_outbox/│ │_status│ │_logs/│       │
│  └────┬────┘ └───┬────┘ └───┬───┘ └──┬───┘      │
└───────┼──────────┼──────────┼────────┼───────────┘
        │          │          │        │
   ┌────▼───┐ ┌───▼───┐ ┌───▼────┐ ┌─▼──────┐
   │ Gemini │ │Claude │ │ChatGPT │ │ Ollama │
   │  CLI   │ │ Code  │ │Desktop │ │ Local  │
   └────────┘ └───────┘ └────────┘ └────────┘
```

### Blackboard Pattern

Toda comunicação entre IAs acontece via **arquivos JSON** na pasta `shared-workspace/`:

- **`_inbox/`** — Tarefas pendentes (escritas pelo Orchestrator)
- **`_outbox/`** — Resultados (escritos pelas IAs)
- **`_status/`** — Estado em tempo real de cada IA
- **`_logs/`** — Histórico completo de operações
- **`_config/`** — Regras de roteamento e configuração

## 📋 Prompts Mestras

O sistema inclui 4 prompts de alto nível:

| Prompt | Arquivo | Função |
|:-------|:--------|:-------|
| 🧠 **Orquestrador** | `prompts/master-orchestrator.md` | Cérebro central do sistema |
| 📊 **Analista de Mercado** | `prompts/market-analyst.md` | Pesquisa e análise de mercado |
| 🏗️ **Arquiteto** | `prompts/project-architect.md` | Design de arquitetura de projetos |
| ⚙️ **Auto-Config GitHub** | `prompts/auto-config-github.md` | Automação de repositórios |

## 🖥️ Dashboard

Interface visual premium com:
- Cards de status em tempo real de cada IA
- Fluxo de orquestração visual
- Kanban de tarefas
- Painel de análise de mercado
- Monitor de logs em tempo real

### Nexus Editais

A interface publicada tambem organiza o ciclo de projetos: descoberta, dossie da proposta, submissao e pos-aprovacao.

- [Modelo do Dossie do Projeto](docs/PROJECT_DOSSIER_MODEL.md)
- [Prompt para continuar com outra IA](CONTINUAR_COM_OUTRA_IA.md)

## 📁 Estrutura do Projeto

```
nexus-ai-orchestrator/
├── .github/workflows/     # CI/CD (GitHub Actions)
├── dashboard/             # Dashboard visual (Vite + React)
├── orchestrator/          # Motor de orquestração (Node.js)
├── shared-workspace/      # Pasta compartilhada (Blackboard)
├── prompts/               # Prompts mestras
├── scripts/               # Scripts PowerShell
└── docs/                  # Documentação
```

## 🔧 Auto-Config GitHub

```powershell
# Setup completo do repositório GitHub
.\scripts\init-github-repo.ps1

# Modo dry-run (apenas mostra o que faria)
.\scripts\init-github-repo.ps1 -DryRun
```

## 📝 Licença

MIT © Nexus Digital
