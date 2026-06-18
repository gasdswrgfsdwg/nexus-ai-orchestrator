import { marketAnalysis } from '../data/mockData';
import './MarketAnalysis.css';

export default function MarketAnalysis() {
  const { overview, swot, competitors, opportunities, metrics } = marketAnalysis;

  return (
    <div className="market-layout">
      {/* ─── Visão do Mercado ─── */}
      <div className="market-overview glass fade-in-up">
        <h3 className="market-section-title">Visão Geral do Mercado</h3>
        <div className="overview-cards">
          <div className="overview-card">
            <span className="overview-value">{overview.marketSize}</span>
            <span className="overview-label">Mercado Total (TAM)</span>
          </div>
          <div className="overview-card">
            <span className="overview-value overview-value--accent">{overview.growthRate}</span>
            <span className="overview-label">Crescimento Anual</span>
          </div>
          <div className="overview-card">
            <span className="overview-value">{overview.sam}</span>
            <span className="overview-label">Endereçável (SAM)</span>
          </div>
          <div className="overview-card">
            <span className="overview-value overview-value--secondary">{overview.som}</span>
            <span className="overview-label">Alcançável (SOM)</span>
          </div>
        </div>
      </div>

      {/* ─── Análise SWOT ─── */}
      <div className="swot-grid">
        <div className="swot-card swot-card--strengths glass stagger-item">
          <div className="swot-header">
            <span className="swot-icon">💪</span>
            <h4 className="swot-title">Forças</h4>
          </div>
          <ul className="swot-list">
            {swot.strengths.map((item, i) => (
              <li key={i} className="swot-item">{item}</li>
            ))}
          </ul>
        </div>

        <div className="swot-card swot-card--weaknesses glass stagger-item">
          <div className="swot-header">
            <span className="swot-icon">⚠️</span>
            <h4 className="swot-title">Fraquezas</h4>
          </div>
          <ul className="swot-list">
            {swot.weaknesses.map((item, i) => (
              <li key={i} className="swot-item">{item}</li>
            ))}
          </ul>
        </div>

        <div className="swot-card swot-card--opportunities glass stagger-item">
          <div className="swot-header">
            <span className="swot-icon">🚀</span>
            <h4 className="swot-title">Oportunidades</h4>
          </div>
          <ul className="swot-list">
            {swot.opportunities.map((item, i) => (
              <li key={i} className="swot-item">{item}</li>
            ))}
          </ul>
        </div>

        <div className="swot-card swot-card--threats glass stagger-item">
          <div className="swot-header">
            <span className="swot-icon">🛡️</span>
            <h4 className="swot-title">Ameaças</h4>
          </div>
          <ul className="swot-list">
            {swot.threats.map((item, i) => (
              <li key={i} className="swot-item">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Métricas do Mercado ─── */}
      <div className="market-metrics glass fade-in-up">
        <h3 className="market-section-title">Métricas Principais</h3>
        <div className="metrics-bars">
          {metrics.map((m, i) => (
            <div key={i} className="metric-bar-row">
              <div className="metric-bar-label">{m.label}</div>
              <div className="metric-bar-track">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${m.value}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  <span className="metric-bar-value">{m.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Cenário Competitivo ─── */}
      <div className="competitors-section glass fade-in-up">
        <h3 className="market-section-title">Cenário Competitivo</h3>
        <div className="competitors-table-wrapper">
          <table className="competitors-table">
            <thead>
              <tr>
                <th>Plataforma</th>
                <th>Categoria</th>
                <th>Pontuação</th>
                <th>Fatia</th>
                <th>Tendência</th>
              </tr>
            </thead>
            <tbody>
              {competitors
                .sort((a, b) => b.score - a.score)
                .map((comp, i) => (
                  <tr key={i} className={comp.name.includes('NEXUS') ? 'competitor-row--ours' : ''}>
                    <td className="comp-name">
                      {comp.name.includes('NEXUS') && <span className="comp-badge">★</span>}
                      {comp.name}
                    </td>
                    <td className="comp-category">{comp.category}</td>
                    <td>
                      <div className="comp-score-bar">
                        <div
                          className="comp-score-fill"
                          style={{ width: `${comp.score}%` }}
                        ></div>
                        <span className="comp-score-text">{comp.score}</span>
                      </div>
                    </td>
                    <td className="comp-share">{comp.marketShare}%</td>
                    <td>
                      <span className={`comp-trend comp-trend--${comp.trend}`}>
                        {comp.trend === 'up' ? '↑' : '→'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Oportunidades Estratégicas ─── */}
      <div className="opportunities-section glass fade-in-up">
        <h3 className="market-section-title">Oportunidades Estratégicas</h3>
        <div className="opportunities-list">
          {opportunities.map((opp, i) => (
            <div key={i} className="opportunity-card stagger-item">
              <div className="opportunity-header">
                <h4 className="opportunity-title">{opp.title}</h4>
                <span className={`badge badge-${opp.priority === 'high' ? 'danger' : 'warning'}`}>
                  {opp.priority === 'high' ? 'Alta' : 'Média'}
                </span>
              </div>
              <p className="opportunity-desc">{opp.description}</p>
              <div className="opportunity-meta">
                <div className="opportunity-impact">
                  <span className="opportunity-meta-label">Impacto</span>
                  <div className="opportunity-impact-bar">
                    <div
                      className="opportunity-impact-fill"
                      style={{ width: `${opp.impact}%` }}
                    ></div>
                  </div>
                  <span className="opportunity-impact-value">{opp.impact}</span>
                </div>
                <span className="opportunity-effort">
                  Esforço: <strong>{opp.effort === 'high' ? 'Alto' : opp.effort === 'medium' ? 'Médio' : 'Baixo'}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
