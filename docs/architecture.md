# Arquitetura do NEXUS AI Orchestrator

## 1. Visão Geral da Arquitetura

O NEXUS AI Orchestrator segue uma **arquitetura orientada a eventos** com comunicação baseada no **Blackboard Pattern** (padrão de quadro-negro). Ao invés de comunicação direta entre agentes, toda troca de informação acontece através de um espaço de memória compartilhado — o diretório `shared-workspace/`.

### Princípios Fundamentais

1. **Desacoplamento Total**: Nenhum agente conhece outro diretamente. Todos leem/escrevem na pasta compartilhada.
2. **Heterogeneidade**: O sistema suporta IAs de diferentes provedores, tipos e capacidades.
3. **Resiliência**: Se um agente falha, o sistema redistribui automaticamente para outro.
4. **Observabilidade**: Toda ação é logada. O Dashboard oferece visibilidade total.
5. **Extensibilidade**: Novos agentes são adicionados apenas criando um adapter e registrando no `routing-rules.json`.

## 2. Componentes do Sistema

### 2.1 Orchestrator Engine (Node.js)

O motor central que coordena tudo:

```
orchestrator/
├── src/
│   ├── core/
│   │   ├── blackboard.js       # Camada de comunicação (filesystem)
│   │   ├── agent-registry.js   # Registro de agentes disponíveis
│   │   ├── task-dispatcher.js  # Distribuição inteligente de tarefas
│   │   └── health-monitor.js   # Monitoramento de saúde
│   ├── adapters/
│   │   ├── gemini-adapter.js   # Integração Gemini CLI
│   │   ├── claude-adapter.js   # Integração Claude Code
│   │   ├── chatgpt-adapter.js  # Integração ChatGPT Desktop
│   │   └── ollama-adapter.js   # Integração Ollama
│   └── strategies/
│       ├── round-robin.js      # Distribuição circular
│       ├── capability-match.js # Match por capacidade
│       └── load-balance.js     # Balanceamento de carga
```

### 2.2 Shared Workspace (Blackboard)

O "cérebro compartilhado" do sistema:

| Diretório | Propósito | Formato |
|:----------|:----------|:--------|
| `_inbox/` | Tarefas para agentes processarem | JSON |
| `_outbox/` | Resultados dos agentes | JSON |
| `_status/` | Status em tempo real | JSON |
| `_logs/` | Histórico de operações | JSON/LOG |
| `_config/` | Configuração e regras | JSON |

### 2.3 Dashboard (React + Vite)

Interface visual servida em `localhost:5173` que se conecta ao Orchestrator via:
- **REST API** (porta 3001) para operações CRUD
- **WebSocket** para atualizações em tempo real

## 3. Fluxo de uma Tarefa

```
1. Usuário/Sistema cria tarefa ────► POST /api/tasks
                                          │
2. Orchestrator recebe ◄──────────────────┘
   │
3. Task Dispatcher seleciona estratégia
   │   ├── Round-Robin?
   │   ├── Capability Match?
   │   └── Load Balance?
   │
4. Escreve JSON na _inbox/ ────────► shared-workspace/_inbox/task-{uuid}.json
   │
5. Adapter do agente detecta novo arquivo
   │
6. Agente processa a tarefa
   │
7. Resultado escrito na _outbox/ ──► shared-workspace/_outbox/result-{uuid}.json
   │
8. Orchestrator consolida resultado
   │
9. Dashboard atualizado via WebSocket
```

## 4. Protocolos de Comunicação

### 4.1 Schema de Tarefa (_inbox/)

```json
{
  "id": "uuid-v4",
  "type": "code-generation | research | analysis | ...",
  "priority": "low | medium | high | critical",
  "payload": {
    "prompt": "Instrução para o agente",
    "context": {},
    "constraints": {}
  },
  "assigned_to": "gemini-cli | claude-code | chatgpt | ollama",
  "created_at": "ISO-8601",
  "deadline": "ISO-8601 | null",
  "metadata": {
    "source": "user | orchestrator | agent",
    "parent_task_id": "uuid | null"
  }
}
```

### 4.2 Schema de Resultado (_outbox/)

```json
{
  "task_id": "uuid-v4",
  "agent_id": "gemini-cli",
  "result": {
    "content": "Resultado gerado",
    "artifacts": [],
    "suggestions": []
  },
  "confidence": 0.95,
  "tokens_used": 1500,
  "processing_time_ms": 3200,
  "completed_at": "ISO-8601",
  "metadata": {
    "model": "gemini-2.5-pro",
    "retries": 0
  }
}
```

## 5. Estratégias de Distribuição

| Estratégia | Quando Usar | Como Funciona |
|:-----------|:------------|:-------------|
| **Round-Robin** | Distribuição uniforme | Rotaciona entre agentes disponíveis |
| **Capability Match** | Tarefas especializadas | Seleciona agente com melhor fit para o tipo de tarefa |
| **Load Balance** | Alta carga | Seleciona agente com menor carga atual |
| **Parallel** | Alta prioridade | Envia para múltiplos agentes e consolida respostas |

## 6. Segurança e Privacidade

- Tarefas com tag `private` são roteadas **apenas** para modelos locais (Ollama, LM Studio)
- Nenhum dado sensível é enviado para cloud sem autorização explícita
- Logs podem ser configurados para excluir payloads sensíveis
- Chaves de API são mantidas no `.env` (fora do controle de versão)
