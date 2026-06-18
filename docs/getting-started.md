# Guia de Início Rápido — NEXUS AI Orchestrator

## Pré-requisitos

Antes de começar, certifique-se de ter:

- [x] **Node.js 20+** instalado ([download](https://nodejs.org/))
- [x] **npm 9+** (vem com Node.js)
- [x] **Git** instalado ([download](https://git-scm.com/))
- [x] Pelo menos **uma IA** instalada e rodando:
  - Gemini CLI (`gemini --version`)
  - Claude Code (`claude --version`)
  - ChatGPT Desktop (processo rodando)
  - Ollama (`http://localhost:11434`)
  - LM Studio (`http://localhost:1234`)

## Passo 1: Setup Inicial

```powershell
# Navegue até o projeto
cd "G:\Meu Drive\Nexus Digital Drive\Projetos\nexus-ai-orchestrator"

# Execute o setup automático
.\scripts\setup.ps1
```

O script vai:
1. Verificar pré-requisitos (Node, npm, Git)
2. Detectar quais IAs estão rodando
3. Criar a estrutura de diretórios
4. Instalar dependências
5. Gerar arquivo `.env`

## Passo 2: Iniciar o Sistema

```powershell
# Opção 1: Iniciar tudo de uma vez
.\scripts\start-orchestrator.ps1

# Opção 2: Iniciar separadamente
# Terminal 1 - Orchestrator
cd orchestrator
npm start

# Terminal 2 - Dashboard
cd dashboard
npm run dev
```

## Passo 3: Acessar o Dashboard

Abra o navegador em **http://localhost:5173**

Você verá:
- Status de cada IA conectada
- Fluxo de orquestração visual
- Board de tarefas (Kanban)
- Monitor de logs em tempo real

## Passo 4: Criar uma Tarefa

### Via Dashboard
Clique no botão **"+ Nova Tarefa"** e preencha os campos.

### Via API
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code-generation",
    "priority": "high",
    "payload": {
      "prompt": "Crie uma função JavaScript que ordena um array usando merge sort"
    }
  }'
```

### Via Pasta Compartilhada
Crie um arquivo JSON na pasta `shared-workspace/_inbox/`:

```json
{
  "id": "minha-tarefa-001",
  "type": "research",
  "priority": "medium",
  "payload": {
    "prompt": "Pesquise as tendências de IA para 2026"
  },
  "created_at": "2026-06-17T15:00:00Z"
}
```

## Passo 5: Health Check

```powershell
.\scripts\health-check.ps1
```

## Passo 6: Configurar GitHub (Opcional)

```powershell
# Certifique-se de ter GitHub CLI instalado e autenticado
gh auth login

# Execute o auto-config
.\scripts\init-github-repo.ps1

# Ou em modo dry-run primeiro
.\scripts\init-github-repo.ps1 -DryRun
```

## Próximos Passos

1. **Personalize as prompts** em `prompts/` para seu caso de uso
2. **Configure regras de roteamento** em `shared-workspace/_config/routing-rules.json`
3. **Adicione novos agentes** criando adapters em `orchestrator/src/adapters/`
4. **Monitore tudo** pelo Dashboard em tempo real
