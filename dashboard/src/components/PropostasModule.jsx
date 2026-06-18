import React from 'react';

export default function PropostasModule({
  proposals,
  setProposals,
  editais,
  activeProposalEditalId,
  setActiveProposalEditalId,
  activeWizardStep,
  setActiveWizardStep,
  errors,
  setErrors,
  appBridge
}) {
  const proposalId = appBridge ? appBridge.state.activeProposalEditalId : activeProposalEditalId;
  const wizardStep = appBridge ? appBridge.state.activeWizardStep : activeWizardStep;
  const proposalsList = appBridge ? appBridge.state.proposals : proposals;
  const currentErrors = appBridge ? appBridge.state.errors : errors;

  const activeProposal = proposalsList[proposalId] || {
    editalId: proposalId,
    objetivos: '',
    justificativa: '',
    metodologia: '',
    budget: [],
    schedule: []
  };

  const edital = editais.find(e => e.id === proposalId) || { titulo: 'Nenhum' };

  const handleProposalSelect = (e) => {
    const val = e.target.value;
    if (appBridge) {
      appBridge.state.activeProposalEditalId = val;
      appBridge.render();
    } else {
      setActiveProposalEditalId(val);
    }
  };

  const handleStepClick = (step) => {
    if (appBridge) {
      appBridge.state.activeWizardStep = step;
      appBridge.render();
    } else {
      setActiveWizardStep(step);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        prop[wizardStep] = val;
      }
    } else {
      setProposals(prev => ({
        ...prev,
        [proposalId]: {
          ...activeProposal,
          [wizardStep]: val
        }
      }));
    }
  };

  const handleGenerateAI = () => {
    let generated = '';
    if (wizardStep === 'objetivos') {
      generated = 'Texto gerado automaticamente por IA para a seção Objetivos: Este projeto visa democratizar o acesso à tecnologia e à cultura regional.';
    } else if (wizardStep === 'justificativa') {
      generated = 'Texto gerado automaticamente por IA para a seção Justificativa: Justifica-se pela escassez de iniciativas integradas na região periférica.';
    } else if (wizardStep === 'metodologia') {
      generated = 'Texto gerado automaticamente por IA para a seção Metodologia: A metodologia compreende 4 fases principais de workshop e mentoria.';
    }
    
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        prop[wizardStep] = generated;
      }
      appBridge.render();
    } else {
      setProposals(prev => ({
        ...prev,
        [proposalId]: {
          ...activeProposal,
          [wizardStep]: generated
        }
      }));
    }
  };

  const handleAddBudgetRow = () => {
    const newId = Date.now();
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        prop.budget.push({ id: newId, descricao: '', valor: 0 });
      }
      appBridge.render();
    } else {
      setProposals(prev => ({
        ...prev,
        [proposalId]: {
          ...activeProposal,
          budget: [...activeProposal.budget, { id: newId, descricao: '', valor: 0 }]
        }
      }));
    }
  };

  const handleDeleteBudgetRow = (rowId) => {
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        prop.budget = prop.budget.filter(item => item.id !== rowId);
      }
      appBridge.render();
    } else {
      setProposals(prev => ({
        ...prev,
        [proposalId]: {
          ...activeProposal,
          budget: activeProposal.budget.filter(item => item.id !== rowId)
        }
      }));
    }
  };

  const handleBudgetDescChange = (rowId, val) => {
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        const item = prop.budget.find(i => i.id === rowId);
        if (item) item.descricao = val;
      }
    } else {
      setProposals(prev => {
        const prop = prev[proposalId];
        const newBudget = prop.budget.map(item => item.id === rowId ? { ...item, descricao: val } : item);
        return {
          ...prev,
          [proposalId]: {
            ...prop,
            budget: newBudget
          }
        };
      });
    }
  };

  const handleBudgetValChange = (rowId, val) => {
    const numVal = Number(val);
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        const item = prop.budget.find(i => i.id === rowId);
        if (item) item.valor = numVal;
        if (numVal < 0) {
          appBridge.state.errors.budget = 'Valor não pode ser negativo';
        } else {
          delete appBridge.state.errors.budget;
        }
      }
      appBridge.render();
    } else {
      setProposals(prev => {
        const prop = prev[proposalId];
        const newBudget = prop.budget.map(item => item.id === rowId ? { ...item, valor: numVal } : item);
        return {
          ...prev,
          [proposalId]: {
            ...prop,
            budget: newBudget
          }
        };
      });
      if (numVal < 0) {
        setErrors(prev => ({ ...prev, budget: 'Valor não pode ser negativo' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.budget;
          return next;
        });
      }
    }
  };

  const handleAddScheduleRow = () => {
    const newId = Date.now();
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        prop.schedule.push({ id: newId, tarefa: '', inicio: '', fim: '' });
      }
      appBridge.render();
    } else {
      setProposals(prev => ({
        ...prev,
        [proposalId]: {
          ...activeProposal,
          schedule: [...activeProposal.schedule, { id: newId, tarefa: '', inicio: '', fim: '' }]
        }
      }));
    }
  };

  const handleDeleteScheduleRow = (rowId) => {
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        prop.schedule = prop.schedule.filter(item => item.id !== rowId);
      }
      appBridge.render();
    } else {
      setProposals(prev => ({
        ...prev,
        [proposalId]: {
          ...activeProposal,
          schedule: activeProposal.schedule.filter(item => item.id !== rowId)
        }
      }));
    }
  };

  const handleScheduleTaskChange = (rowId, val) => {
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        const item = prop.schedule.find(i => i.id === rowId);
        if (item) item.tarefa = val;
      }
    } else {
      setProposals(prev => {
        const prop = prev[proposalId];
        const newSchedule = prop.schedule.map(item => item.id === rowId ? { ...item, tarefa: val } : item);
        return {
          ...prev,
          [proposalId]: {
            ...prop,
            schedule: newSchedule
          }
        };
      });
    }
  };

  const validateDates = (item) => {
    if (item.inicio && item.fim) {
      if (new Date(item.fim) < new Date(item.inicio)) {
        appBridge.state.errors.schedule = 'Fim deve ser após Início';
      } else {
        delete appBridge.state.errors.schedule;
      }
      appBridge.render();
    }
  };

  const validateDatesFallback = (item) => {
    if (item.inicio && item.fim) {
      if (new Date(item.fim) < new Date(item.inicio)) {
        setErrors(prev => ({ ...prev, schedule: 'Fim deve ser após Início' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.schedule;
          return next;
        });
      }
    }
  };

  const handleScheduleStartChange = (rowId, val) => {
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        const item = prop.schedule.find(i => i.id === rowId);
        if (item) {
          item.inicio = val;
          validateDates(item);
        }
      }
    } else {
      let updatedItem;
      setProposals(prev => {
        const prop = prev[proposalId];
        const newSchedule = prop.schedule.map(item => {
          if (item.id === rowId) {
            updatedItem = { ...item, inicio: val };
            return updatedItem;
          }
          return item;
        });
        return {
          ...prev,
          [proposalId]: {
            ...prop,
            schedule: newSchedule
          }
        };
      });
      if (updatedItem) {
        validateDatesFallback(updatedItem);
      }
    }
  };

  const handleScheduleEndChange = (rowId, val) => {
    if (appBridge) {
      const prop = appBridge.state.proposals[proposalId];
      if (prop) {
        const item = prop.schedule.find(i => i.id === rowId);
        if (item) {
          item.fim = val;
          validateDates(item);
        }
      }
    } else {
      let updatedItem;
      setProposals(prev => {
        const prop = prev[proposalId];
        const newSchedule = prop.schedule.map(item => {
          if (item.id === rowId) {
            updatedItem = { ...item, fim: val };
            return updatedItem;
          }
          return item;
        });
        return {
          ...prev,
          [proposalId]: {
            ...prop,
            schedule: newSchedule
          }
        };
      });
      if (updatedItem) {
        validateDatesFallback(updatedItem);
      }
    }
  };

  const handleSaveProposal = () => {
    if (appBridge) {
      appBridge.render();
    }
  };

  const showTextEditor = ['objetivos', 'justificativa', 'metodologia'].includes(wizardStep);

  let editorValue = '';
  if (wizardStep === 'objetivos') editorValue = activeProposal.objetivos;
  else if (wizardStep === 'justificativa') editorValue = activeProposal.justificativa;
  else if (wizardStep === 'metodologia') editorValue = activeProposal.metodologia;

  return (
    <div className="module-propostas">
      <div className="proposal-header glass">
        <h3>Proposta para: <span id="proposal-edital-title">{edital.titulo}</span></h3>
        <div className="proposal-selector">
          <label htmlFor="proposal-edital-select">Alternar Proposta:</label>
          <select id="proposal-edital-select" value={proposalId} onChange={handleProposalSelect}>
            {Object.keys(proposalsList).map(id => {
              const ed = editais.find(e => e.id === id) || { titulo: id };
              return <option key={id} value={id}>{ed.titulo}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="proposal-wizard">
        <nav className="wizard-nav">
          {['objetivos', 'justificativa', 'metodologia', 'cronograma', 'orcamento'].map(step => (
            <button
              key={step}
              className={`wizard-step ${wizardStep === step ? 'active' : ''}`}
              data-step={step}
              onClick={() => handleStepClick(step)}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </button>
          ))}
        </nav>

        <div className="wizard-content glass">
          {showTextEditor && (
            <div className="text-editor-container">
              <textarea
                id="rich-text-editor"
                rows="10"
                placeholder="Digite aqui o conteúdo da seção..."
                value={editorValue}
                onChange={handleTextChange}
              />
              <button id="btn-generate-ai" onClick={handleGenerateAI}>Gerar com IA</button>
            </div>
          )}

          {wizardStep === 'orcamento' && (
            <div className="budget-editor-container">
              <h4>Planilha Orçamentária</h4>
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor (R$)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeProposal.budget || []).map(item => (
                    <tr key={item.id} data-row-id={item.id}>
                      <td>
                        <input
                          type="text"
                          className="budget-desc"
                          value={item.descricao}
                          onChange={(e) => handleBudgetDescChange(item.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="budget-val"
                          value={item.valor}
                          onChange={(e) => handleBudgetValChange(item.id, e.target.value)}
                        />
                        {item.valor < 0 && (
                          <span className="validation-error">Valor não pode ser negativo</span>
                        )}
                      </td>
                      <td>
                        <button className="btn-delete-budget-row" data-id={item.id} onClick={() => handleDeleteBudgetRow(item.id)}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button id="btn-add-budget-row" onClick={handleAddBudgetRow}>Adicionar Item</button>
              {currentErrors.budget && (
                <div className="error-message" id="budget-error-msg">{currentErrors.budget}</div>
              )}
            </div>
          )}

          {wizardStep === 'cronograma' && (
            <div className="schedule-editor-container">
              <h4>Cronograma de Atividades</h4>
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Atividade</th>
                    <th>Data de Início</th>
                    <th>Data de Fim</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeProposal.schedule || []).map(item => {
                    const isInvalid = new Date(item.fim) < new Date(item.inicio);
                    return (
                      <tr key={item.id} data-row-id={item.id}>
                        <td>
                          <input
                            type="text"
                            className="schedule-task"
                            value={item.tarefa}
                            onChange={(e) => handleScheduleTaskChange(item.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="schedule-start"
                            value={item.inicio}
                            onChange={(e) => handleScheduleStartChange(item.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            className="schedule-end"
                            value={item.fim}
                            onChange={(e) => handleScheduleEndChange(item.id, e.target.value)}
                          />
                          {isInvalid && (
                            <span className="validation-error">Fim deve ser após Início</span>
                          )}
                        </td>
                        <td>
                          <button className="btn-delete-schedule-row" data-id={item.id} onClick={() => handleDeleteScheduleRow(item.id)}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button id="btn-add-schedule-row" onClick={handleAddScheduleRow}>Adicionar Atividade</button>
              {currentErrors.schedule && (
                <div className="error-message" id="schedule-error-msg">{currentErrors.schedule}</div>
              )}
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <button id="btn-save-proposal" onClick={handleSaveProposal}>Salvar Proposta</button>
        </div>
      </div>
    </div>
  );
}
