import './OrchestrationFlow.css';

const AGENTS = [
  { id: 'gemini', name: 'Gemini CLI', icon: '♊', status: 'online', color: '#4285f4' },
  { id: 'claude', name: 'Claude Code', icon: '🤖', status: 'busy', color: '#d97706' },
  { id: 'chatgpt', name: 'ChatGPT', icon: '🧠', status: 'online', color: '#10a37f' },
  { id: 'ollama', name: 'Ollama', icon: '🦙', status: 'offline', color: '#8b5cf6' },
];

const STATUS_LABELS = { online: 'online', busy: 'ocupado', offline: 'offline' };

export default function OrchestrationFlow() {
  return (
    <div className="flow-container glass">
      <div className="flow-diagram">
        {/* Camada 1: Usuário */}
        <div className="flow-layer flow-layer--source">
          <div className="flow-node flow-node--user">
            <div className="flow-node-ring"></div>
            <span className="flow-node-icon">👤</span>
            <span className="flow-node-label">Requisição do Usuário</span>
            <div className="flow-node-pulse"></div>
          </div>
        </div>

        {/* Conexão: Usuário → Orquestrador */}
        <div className="flow-connection flow-connection--active">
          <div className="flow-line"></div>
          <div className="flow-dot flow-dot--1"></div>
          <div className="flow-dot flow-dot--2"></div>
          <div className="flow-dot flow-dot--3"></div>
        </div>

        {/* Camada 2: Orquestrador */}
        <div className="flow-layer flow-layer--core">
          <div className="flow-node flow-node--orchestrator">
            <div className="flow-node-ring flow-node-ring--core"></div>
            <span className="flow-node-icon">⚡</span>
            <span className="flow-node-label">NEXUS Orchestrator</span>
            <span className="flow-node-sublabel">Roteamento Inteligente · Balanceamento</span>
            <div className="flow-node-glow"></div>
          </div>
        </div>

        {/* Conexões: Orquestrador → Agentes */}
        <div className="flow-fan-connections">
          {AGENTS.map((agent, i) => (
            <div
              key={agent.id}
              className={`flow-fan-line flow-fan-line--${i} ${agent.status !== 'offline' ? 'flow-fan-line--active' : 'flow-fan-line--inactive'}`}
            >
              <div className="flow-fan-track"></div>
              {agent.status !== 'offline' && (
                <>
                  <div className="flow-fan-dot flow-fan-dot--a"></div>
                  <div className="flow-fan-dot flow-fan-dot--b"></div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Camada 3: Agentes */}
        <div className="flow-layer flow-layer--agents">
          {AGENTS.map(agent => (
            <div
              key={agent.id}
              className={`flow-node flow-node--agent flow-node--${agent.status}`}
              style={{ '--node-color': agent.color }}
            >
              <div className="flow-node-ring flow-node-ring--agent"></div>
              <span className="flow-node-icon">{agent.icon}</span>
              <span className="flow-node-label">{agent.name}</span>
              <span className={`flow-node-status flow-node-status--${agent.status}`}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>
          ))}
        </div>

        {/* Conexões: Agentes → Resultado */}
        <div className="flow-connection flow-connection--active flow-connection--merge">
          <div className="flow-line"></div>
          <div className="flow-dot flow-dot--1"></div>
          <div className="flow-dot flow-dot--2"></div>
        </div>

        {/* Camada 4: Resultado */}
        <div className="flow-layer flow-layer--output">
          <div className="flow-node flow-node--result">
            <div className="flow-node-ring flow-node-ring--result"></div>
            <span className="flow-node-icon">✨</span>
            <span className="flow-node-label">Resultado Consolidado</span>
            <span className="flow-node-sublabel">Consolidado · Validado · Entregue</span>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flow-legend">
        <div className="flow-legend-item">
          <span className="flow-legend-dot flow-legend-dot--active"></span>
          <span>Ativo</span>
        </div>
        <div className="flow-legend-item">
          <span className="flow-legend-dot flow-legend-dot--busy"></span>
          <span>Processando</span>
        </div>
        <div className="flow-legend-item">
          <span className="flow-legend-dot flow-legend-dot--offline"></span>
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
}
