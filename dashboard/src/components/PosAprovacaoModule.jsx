import React from 'react';

export default function PosAprovacaoModule({
  projects,
  setProjects,
  proposals,
  posAprovacao,
  setPosAprovacao,
  appBridge
}) {
  const projectList = appBridge ? appBridge.state.projects : projects;
  const proposalsList = appBridge ? appBridge.state.proposals : proposals;
  const currentPosData = appBridge ? appBridge.state.posAprovacao : posAprovacao;

  const approvedProjects = projectList.filter(p => p.estagio === 'Aprovado');

  const [selectedId, setSelectedId] = React.useState(approvedProjects[0]?.id || '');
  const [showReport, setShowReport] = React.useState(false);
  const [reportContent, setReportContent] = React.useState('');

  const activeProjId = appBridge?.state.selectedApprovedProjectId || selectedId || approvedProjects[0]?.id;
  const activeProj = approvedProjects.find(p => p.id === activeProjId);

  // Initialize data for this project if not present
  React.useEffect(() => {
    if (activeProj && (!currentPosData || !currentPosData[activeProj.id])) {
      const proposal = proposalsList[activeProj.editalId] || { budget: [] };
      const budget = proposal.budget && proposal.budget.length > 0
        ? proposal.budget
        : [
            { id: 1, descricao: 'Recursos Humanos', valor: 150000 },
            { id: 2, descricao: 'Logística', valor: 100000 }
          ];

      const initialData = {
        rubrics: budget.map(item => ({
          id: item.id,
          descricao: item.descricao || item.item,
          planejado: item.valor,
          gasto: 0
        })),
        transactions: [],
        realSchedule: [
          { id: 1, tarefa: 'Fase de Planejamento', planejado: '2026-11-30', real: '2026-12-05', status: 'atrasado' },
          { id: 2, tarefa: 'Produção e Execução', planejado: '2027-04-30', real: '2027-04-30', status: 'em_dia' }
        ],
        obligations: [
          { id: 1, desc: 'Relatório Técnico Semestral', concluida: false },
          { id: 2, desc: 'Prestação de Contas Financeira', concluida: false }
        ]
      };

      if (appBridge) {
        appBridge.state.posAprovacao[activeProj.id] = initialData;
        appBridge.render();
      } else {
        setPosAprovacao(prev => ({
          ...prev,
          [activeProj.id]: initialData
        }));
      }
    }
  }, [activeProj, currentPosData, proposalsList, appBridge, setPosAprovacao]);

  if (approvedProjects.length === 0) {
    return <div className="ledger-empty">Estado vazio estruturado: Nenhum projeto aprovado para prestação de contas.</div>;
  }

  if (!activeProj) {
    return <div className="ledger-empty">Nenhum projeto selecionado.</div>;
  }

  const data = currentPosData[activeProj.id];

  if (!data) {
    return <div className="ledger-empty">Estado vazio estruturado: Nenhuma rubrica configurada.</div>;
  }

  const handleProjectSelectChange = (e) => {
    const val = e.target.value;
    if (appBridge) {
      appBridge.state.selectedApprovedProjectId = val;
      appBridge.render();
    } else {
      setSelectedId(val);
    }
  };

  const handleDeleteRubric = (rubricId) => {
    if (appBridge) {
      const pData = appBridge.state.posAprovacao[activeProj.id];
      if (pData) {
        pData.rubrics = pData.rubrics.filter(r => r.id !== rubricId);
      }
      appBridge.render();
    } else {
      setPosAprovacao(prev => {
        const pData = prev[activeProj.id];
        if (!pData) return prev;
        return {
          ...prev,
          [activeProj.id]: {
            ...pData,
            rubrics: pData.rubrics.filter(r => r.id !== rubricId)
          }
        };
      });
    }
  };

  const handleAddTransactionSubmit = (e) => {
    e.preventDefault();
    const descInput = document.getElementById('tx-desc');
    const valInput = document.getElementById('tx-val');
    const rubricSelect = document.getElementById('tx-rubric-select');

    const desc = descInput.value;
    const val = Number(valInput.value);
    const rubricId = Number(rubricSelect.value);

    if (appBridge) {
      const pData = appBridge.state.posAprovacao[activeProj.id];
      if (pData) {
        const rubric = pData.rubrics.find(r => r.id === rubricId);
        if (rubric) {
          rubric.gasto += val;
          pData.transactions.push({ id: Date.now(), rubricId, descricao: desc, valor: val });
        }
      }
      appBridge.render();
    } else {
      setPosAprovacao(prev => {
        const pData = prev[activeProj.id];
        if (!pData) return prev;
        const rubric = pData.rubrics.find(r => r.id === rubricId);
        if (!rubric) return prev;

        const newRubrics = pData.rubrics.map(r => r.id === rubricId ? { ...r, gasto: r.gasto + val } : r);
        const newTransactions = [...pData.transactions, { id: Date.now(), rubricId, descricao: desc, valor: val }];

        return {
          ...prev,
          [activeProj.id]: {
            ...pData,
            rubrics: newRubrics,
            transactions: newTransactions
          }
        };
      });
    }

    // Reset inputs
    descInput.value = '';
    valInput.value = '';
  };

  const handleObligationCheckChange = (obId, isChecked) => {
    if (appBridge) {
      const pData = appBridge.state.posAprovacao[activeProj.id];
      if (pData) {
        const obligation = pData.obligations.find(o => o.id === obId);
        if (obligation) {
          obligation.concluida = isChecked;
        }
      }
      appBridge.render();
    } else {
      setPosAprovacao(prev => {
        const pData = prev[activeProj.id];
        if (!pData) return prev;
        const newObligations = pData.obligations.map(o => o.id === obId ? { ...o, concluida: isChecked } : o);
        return {
          ...prev,
          [activeProj.id]: {
            ...pData,
            obligations: newObligations
          }
        };
      });
    }
  };

  const handleExportReport = () => {
    let md = '';
    if (data.rubrics.length === 0) {
      md = '# Relatório de Prestação de Contas\n\nEstrutura padrão limpa. Nenhum dado de projeto disponível.';
    } else {
      const totalPlanejado = data.rubrics.reduce((acc, r) => acc + r.planejado, 0);
      const totalGasto = data.rubrics.reduce((acc, r) => acc + r.gasto, 0);
      md = `# Relatório de Prestação de Contas\n\n` +
           `**Projeto:** ${activeProj.editalNome}\n` +
           `**Orçamento Planejado:** R$ ${totalPlanejado.toLocaleString('pt-BR')}\n` +
           `**Orçamento Realizado:** R$ ${totalGasto.toLocaleString('pt-BR')}\n` +
           `**Saldo Atual:** R$ ${(totalPlanejado - totalGasto).toLocaleString('pt-BR')}\n\n` +
           `## Demonstrativo por Rubrica\n` +
           data.rubrics.map(r => `- **${r.descricao}**: Planejado R$ ${r.planejado.toLocaleString('pt-BR')} | Gasto R$ ${r.gasto.toLocaleString('pt-BR')}`).join('\n') +
           `\n\n## Histórico de Transações\n` +
           data.transactions.map(t => `- ${t.descricao}: R$ ${t.valor.toLocaleString('pt-BR')}`).join('\n');
    }
    setReportContent(md);
    setShowReport(true);
  };

  return (
    <div className="module-pos-aprovacao">
      <div className="project-selector glass">
        <label htmlFor="approved-project-select">Selecionar Projeto Aprovado:</label>
        <select id="approved-project-select" value={activeProjId} onChange={handleProjectSelectChange}>
          {approvedProjects.map(p => (
            <option key={p.id} value={p.id}>{p.editalNome}</option>
          ))}
        </select>
      </div>

      <div className="pos-aprovacao-grid">
        <section className="financial-ledger glass">
          <h3>Controle Financeiro</h3>
          <div className="rubrics-list">
            {data.rubrics.length === 0 ? (
              <div className="ledger-empty">Estado vazio estruturado: Nenhuma rubrica configurada.</div>
            ) : (
              data.rubrics.map(rub => {
                const isOverflow = rub.gasto > rub.planejado;
                return (
                  <div key={rub.id} className={`rubric-row ${isOverflow ? 'ledger-overflow' : ''}`} data-id={rub.id}>
                    <span className="rubric-desc">{rub.descricao}</span>
                    <span className="rubric-planejado">Planejado: R$ {rub.planejado.toLocaleString('pt-BR')}</span>
                    <span className="rubric-gasto">Gasto: R$ {rub.gasto.toLocaleString('pt-BR')}</span>
                    <span className="rubric-saldo">Saldo: R$ {(rub.planejado - rub.gasto).toLocaleString('pt-BR')}</span>
                    {isOverflow && <span className="overflow-alert">Estouro!</span>}
                    <button className="btn-delete-rubric" data-id={rub.id} onClick={() => handleDeleteRubric(rub.id)}>
                      Excluir Rubrica
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <form className="add-transaction-form" onSubmit={handleAddTransactionSubmit}>
            <h4>Adicionar Nova Transação</h4>
            <div className="form-row">
              <input type="text" id="tx-desc" placeholder="Descrição da Despesa" required />
              <input type="number" id="tx-val" placeholder="Valor (R$)" required />
              <select id="tx-rubric-select">
                {data.rubrics.map(r => (
                  <option key={r.id} value={r.id}>{r.descricao}</option>
                ))}
              </select>
            </div>
            <button type="submit" id="btn-add-tx">Adicionar Gasto</button>
          </form>

          <div className="transactions-list">
            <h4>Histórico de Gastos</h4>
            {data.transactions.map(t => (
              <div key={t.id} className="transaction-item">
                <span>{t.descricao}</span>
                <span>R$ {t.valor.toLocaleString('pt-BR')}</span>
                <span>Rubrica: {data.rubrics.find(r => r.id === t.rubricId)?.descricao || 'Desconhecida'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="schedule-tracking glass">
          <h3>Comparativo de Cronograma</h3>
          <div className="schedule-comparison">
            {data.realSchedule.map(s => (
              <div key={s.id} className={`schedule-compare-row ${s.status === 'atrasado' ? 'status-atrasado' : ''}`}>
                <span className="compare-task">{s.tarefa}</span>
                <span className="compare-planned">Planejado: {s.planejado}</span>
                <span className="compare-real">Realizado: {s.real}</span>
                {s.status === 'atrasado' && <span className="delay-alert">Atrasado!</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="obligations-checklist glass">
          <h3>Checklist de Obrigações</h3>
          <div className="obligations-list">
            {data.obligations.map(ob => (
              <label key={ob.id} className="obligation-item">
                <input
                  type="checkbox"
                  className="obligation-chk"
                  data-ob-id={ob.id}
                  checked={ob.concluida}
                  onChange={(e) => handleObligationCheckChange(ob.id, e.target.checked)}
                />
                <span className="obligation-desc">{ob.desc}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="pos-aprovacao-footer glass">
        <button id="btn-export-report" onClick={handleExportReport}>Exportar Relatório</button>
        <pre id="export-output" style={{ display: showReport ? 'block' : 'none' }}>
          {reportContent}
        </pre>
      </div>
    </div>
  );
}
