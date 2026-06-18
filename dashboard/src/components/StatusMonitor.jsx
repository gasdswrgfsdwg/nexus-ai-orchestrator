import { useEffect, useRef } from 'react';
import { logs, agents, systemMetrics } from '../data/mockData';
import './StatusMonitor.css';

const LEVEL_CONFIG = {
  info: { color: 'var(--accent-info)', prefix: 'INFO' },
  success: { color: 'var(--accent-secondary)', prefix: ' OK ' },
  warning: { color: 'var(--accent-warning)', prefix: 'ALRT' },
  error: { color: 'var(--accent-danger)', prefix: 'ERRO' },
};

const STATUS_LABELS = { online: 'online', busy: 'ocupado', offline: 'offline' };

export default function StatusMonitor({ fullView = false }) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className={`monitor-layout ${fullView ? 'monitor-layout--full' : ''}`}>
      {/* ─── Métricas do Sistema ─── */}
      <div className="monitor-metrics glass">
        <h3 className="monitor-section-title">Visão Geral do Sistema</h3>
        <div className="metrics-grid">
          <div className="metric-card metric-card--primary">
            <span className="metric-card-value">{systemMetrics.totalTasks.toLocaleString()}</span>
            <span className="metric-card-label">Total de Tarefas</span>
          </div>
          <div className="metric-card metric-card--secondary">
            <span className="metric-card-value">{systemMetrics.avgResponseTime}s</span>
            <span className="metric-card-label">Resposta Média</span>
          </div>
          <div className="metric-card metric-card--success">
            <span className="metric-card-value">{systemMetrics.uptime}</span>
            <span className="metric-card-label">Tempo Ativo</span>
          </div>
          <div className="metric-card metric-card--info">
            <span className="metric-card-value">{systemMetrics.completedToday}</span>
            <span className="metric-card-label">Concluídas Hoje</span>
          </div>
          {fullView && (
            <>
              <div className="metric-card metric-card--warning">
                <span className="metric-card-value">{systemMetrics.errorRate}</span>
                <span className="metric-card-label">Taxa de Erro</span>
              </div>
              <div className="metric-card">
                <span className="metric-card-value">{systemMetrics.peakConcurrency}</span>
                <span className="metric-card-label">Pico de Concorrência</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Saúde dos Agentes ─── */}
      <div className="monitor-health glass">
        <h3 className="monitor-section-title">Saúde dos Agentes</h3>
        <div className="health-list">
          {agents.map(agent => (
            <div key={agent.id} className="health-row">
              <div className="health-agent">
                <span className="health-avatar">{agent.avatar}</span>
                <div className="health-info">
                  <span className="health-name">{agent.name}</span>
                  <span className={`health-status health-status--${agent.status}`}>
                    {STATUS_LABELS[agent.status] || agent.status}
                  </span>
                </div>
              </div>

              <div className="health-bars">
                <div className="health-bar-group">
                  <span className="health-bar-label">MEM</span>
                  <div className="health-bar-track">
                    <div
                      className={`health-bar-fill ${agent.memoryUsage > 80 ? 'health-bar-fill--warn' : ''}`}
                      style={{ width: `${agent.memoryUsage}%` }}
                    ></div>
                  </div>
                  <span className="health-bar-value">{agent.memoryUsage}%</span>
                </div>
                <div className="health-bar-group">
                  <span className="health-bar-label">CPU</span>
                  <div className="health-bar-track">
                    <div
                      className={`health-bar-fill health-bar-fill--cpu ${agent.cpuUsage > 70 ? 'health-bar-fill--warn' : ''}`}
                      style={{ width: `${agent.cpuUsage}%` }}
                    ></div>
                  </div>
                  <span className="health-bar-value">{agent.cpuUsage}%</span>
                </div>
              </div>

              <div className="health-meta">
                <span className="health-uptime">{agent.uptime}%</span>
                <span className="health-meta-label">tempo ativo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Visualizador de Registros ─── */}
      <div className={`monitor-logs glass ${fullView ? 'monitor-logs--full' : ''}`}>
        <div className="logs-header">
          <h3 className="monitor-section-title">Registros ao Vivo</h3>
          <div className="logs-controls">
            <span className="logs-live-badge">
              <span className="logs-live-dot"></span>
              TRANSMITINDO
            </span>
          </div>
        </div>

        <div className="logs-terminal" ref={logRef}>
          {logs.map(log => {
            const config = LEVEL_CONFIG[log.level];
            return (
              <div key={log.id} className="log-entry stagger-item">
                <span className="log-timestamp">{log.timestamp}</span>
                <span
                  className="log-level"
                  style={{ color: config.color }}
                >
                  [{config.prefix}]
                </span>
                <span className="log-agent">{log.agent}</span>
                <span className="log-message">{log.message}</span>
              </div>
            );
          })}
          <div className="log-cursor">
            <span className="cursor-blink">█</span>
          </div>
        </div>
      </div>
    </div>
  );
}
