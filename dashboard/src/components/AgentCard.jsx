import { useState } from 'react';
import './AgentCard.css';

export default function AgentCard({ agent, index }) {
  const [expanded, setExpanded] = useState(false);

  const statusClass = `agent-status--${agent.status}`;
  const statusLabels = { online: 'Online', busy: 'Ocupado', offline: 'Offline' };
  const statusLabel = statusLabels[agent.status] || agent.status;

  const timeSinceActive = () => {
    if (!agent.lastActive) return 'N/D';
    const diff = Date.now() - new Date(agent.lastActive).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}m atrás`;
    return `${Math.floor(mins / 60)}h atrás`;
  };

  return (
    <div
      className={`agent-card glass glass-hover stagger-item ${expanded ? 'agent-card--expanded' : ''}`}
      style={{ '--agent-color': agent.color, animationDelay: `${index * 0.08}s` }}
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && setExpanded(!expanded)}
    >
      {/* Borda com glow */}
      <div className="agent-card-glow"></div>

      {/* Cabeçalho */}
      <div className="agent-card-header">
        <div className="agent-avatar">
          <span className="agent-avatar-icon">{agent.avatar}</span>
          <span className={`agent-status-dot ${statusClass}`}>
            {agent.status === 'online' && <span className="status-pulse-ring"></span>}
          </span>
        </div>
        <div className="agent-info">
          <h3 className="agent-name">{agent.name}</h3>
          <span className="agent-model">{agent.model}</span>
        </div>
        <span className={`agent-status-badge ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Estatísticas */}
      <div className="agent-stats">
        <div className="agent-stat">
          <span className="agent-stat-value">
            {agent.responseTime ? `${agent.responseTime}s` : '—'}
          </span>
          <span className="agent-stat-label">Resposta</span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-value">{agent.tasksCompleted.toLocaleString()}</span>
          <span className="agent-stat-label">Tarefas</span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-value">{agent.successRate}%</span>
          <span className="agent-stat-label">Sucesso</span>
        </div>
      </div>

      {/* Barras de recursos */}
      <div className="agent-resources">
        <div className="resource-bar">
          <div className="resource-bar-header">
            <span className="resource-label">Memória</span>
            <span className="resource-value">{agent.memoryUsage}%</span>
          </div>
          <div className="resource-track">
            <div
              className="resource-fill"
              style={{ width: `${agent.memoryUsage}%` }}
            ></div>
          </div>
        </div>
        <div className="resource-bar">
          <div className="resource-bar-header">
            <span className="resource-label">CPU</span>
            <span className="resource-value">{agent.cpuUsage}%</span>
          </div>
          <div className="resource-track">
            <div
              className="resource-fill resource-fill--cpu"
              style={{ width: `${agent.cpuUsage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="agent-details">
          <div className="agent-detail-row">
            <span className="detail-label">Tempo Ativo</span>
            <span className="detail-value">{agent.uptime}%</span>
          </div>
          <div className="agent-detail-row">
            <span className="detail-label">Tokens Usados</span>
            <span className="detail-value">{agent.tokensUsed.toLocaleString()}</span>
          </div>
          <div className="agent-detail-row">
            <span className="detail-label">Conexões</span>
            <span className="detail-value">{agent.activeConnections}</span>
          </div>
          <div className="agent-detail-row">
            <span className="detail-label">Última Atividade</span>
            <span className="detail-value">{timeSinceActive()}</span>
          </div>

          <div className="agent-capabilities">
            <span className="detail-label">Capacidades</span>
            <div className="capability-tags">
              {agent.capabilities.map(cap => (
                <span key={cap} className="capability-tag">{cap}</span>
              ))}
            </div>
          </div>

          <p className="agent-description">{agent.description}</p>
        </div>
      )}

      {/* Indicador de expandir */}
      <div className="agent-expand-hint">
        <span className={`expand-chevron ${expanded ? 'expand-chevron--up' : ''}`}>‹</span>
      </div>
    </div>
  );
}
