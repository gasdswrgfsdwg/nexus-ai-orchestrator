import React from 'react';

export default function ProjetosModule({ projects, setProjects, appBridge }) {
  const list = appBridge ? appBridge.state.projects : projects;

  const checkIsNearDeadline = (deadlineStr) => {
    const dl = new Date(deadlineStr);
    const today = new Date('2026-06-17'); // fixed base date representing baseline time
    const diff = dl.getTime() - today.getTime();
    const days = diff / (1000 * 3600 * 24);
    return days >= 0 && days <= 60;
  };

  const handleDocChkChange = (projId, docType, isChecked) => {
    const proj = list.find(p => p.id === projId);
    if (!proj) return;

    let cnd = proj.documentosCompletosPercent >= 33;
    let exec = proj.documentosCompletosPercent >= 66;
    let jur = proj.documentosCompletosPercent === 100;
    if (docType === 'cnd') cnd = isChecked;
    if (docType === 'exec') exec = isChecked;
    if (docType === 'jur') jur = isChecked;
    
    const checkedCount = [cnd, exec, jur].filter(Boolean).length;
    const newPercent = Math.round((checkedCount / 3) * 100);

    if (appBridge) {
      const p = appBridge.state.projects.find(p => p.id === projId);
      if (p) {
        p.documentosCompletosPercent = newPercent;
      }
      appBridge.render();
    } else {
      setProjects(prev => prev.map(p => p.id === projId ? { ...p, documentosCompletosPercent: newPercent } : p));
    }
  };

  const handleDragStart = (e, projId) => {
    e.dataTransfer.setData('text/plain', projId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    const projId = e.dataTransfer.getData('text/plain');
    if (appBridge) {
      appBridge.moveProject(projId, stage);
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === projId) {
          if (p.estagio === 'Rascunho' && stage === 'Aprovado') {
            return p; // rule validation
          }
          return { ...p, estagio: stage };
        }
        return p;
      }));
    }
  };

  const COLUMNS = [
    { id: 'Rascunho', label: 'Rascunho' },
    { id: 'Em Elaboração', label: 'Em Elaboração' },
    { id: 'Revisão Interna', label: 'Revisão Interna' },
    { id: 'Pronto para Submissão', label: 'Pronto para Submissão' },
    { id: 'Submetido', label: 'Submetido' },
    { id: 'Aprovado', label: 'Aprovado' }
  ];

  const hasReprovado = list.some(p => p.estagio === 'Reprovado');
  if (hasReprovado) {
    COLUMNS.push({ id: 'Reprovado', label: 'Reprovado' });
  }

  return (
    <div className="module-kanban">
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colProjects = list.filter(p => p.estagio === col.id);
          return (
            <div
              key={col.id}
              className="kanban-column"
              data-stage={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="column-header">
                <h3>{col.label}</h3>
                <span className="column-count">{colProjects.length}</span>
              </div>
              <div className="column-body">
                {colProjects.map(proj => {
                  const isNearDeadline = checkIsNearDeadline(proj.prazo);
                  return (
                    <div
                      key={proj.id}
                      className="project-card"
                      draggable="true"
                      data-id={proj.id}
                      onDragStart={(e) => handleDragStart(e, proj.id)}
                    >
                      <h4 className="project-title">{proj.editalNome}</h4>
                      <div className="project-meta">
                        <p>Prazo: <span className="project-deadline">{proj.prazo}</span> 
                          {isNearDeadline && <span className="deadline-alert">Próximo!</span>}
                        </p>
                        <p>Agente: <span className="project-agent">{proj.agenteAtribuido || 'Nenhum agente'}</span></p>
                        <p>Docs: <span className="project-progress-text">{proj.documentosCompletosPercent}%</span></p>
                      </div>
                      <div className="project-docs-checklist">
                        <label>
                          <input
                            type="checkbox"
                            className="doc-chk"
                            data-proj-id={proj.id}
                            data-doc="cnd"
                            checked={proj.documentosCompletosPercent >= 33}
                            onChange={(e) => handleDocChkChange(proj.id, 'cnd', e.target.checked)}
                          /> Certidões
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            className="doc-chk"
                            data-proj-id={proj.id}
                            data-doc="exec"
                            checked={proj.documentosCompletosPercent >= 66}
                            onChange={(e) => handleDocChkChange(proj.id, 'exec', e.target.checked)}
                          /> Projeto Executivo
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            className="doc-chk"
                            data-proj-id={proj.id}
                            data-doc="jur"
                            checked={proj.documentosCompletosPercent === 100}
                            onChange={(e) => handleDocChkChange(proj.id, 'jur', e.target.checked)}
                          /> Contrato Social
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <section className="timeline-section glass">
        <h3>Visualização de Timeline</h3>
        <div className="timeline-view">
          {list.map(proj => (
            <div key={proj.id} className="timeline-row">
              <span className="timeline-proj-name">{proj.editalNome}</span>
              <div className="timeline-bar-container">
                <div className="timeline-bar" style={{ width: `${Math.max(20, proj.documentosCompletosPercent)}%` }}>
                  Prazo: {proj.prazo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
