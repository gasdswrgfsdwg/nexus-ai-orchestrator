import React from 'react';
import { Download, FileJson, FileText, Sparkles, Upload } from 'lucide-react';
import {
  BUDGET_CATEGORY_OPTIONS,
  BUDGET_STATUS_OPTIONS,
  FREQUENCY_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  PROJECT_AREA_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  TEAM_LINK_OPTIONS,
  TEAM_ROLE_OPTIONS,
  UNIT_OPTIONS,
  buildAnuenciaMarkdown,
  buildProjectMarkdown,
  createBudgetItem,
  createEmptyProposal,
  createGoal,
  createTeamMember,
  getBudgetSummary,
  getBudgetTotal,
  getDossierCompletion,
  normalizeBudgetItem,
  normalizeGoal,
  normalizeProposal,
  normalizeTeamMember,
} from '../data/projectModel';

const WIZARD_STEPS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'objetivos', label: 'Objetivos' },
  { id: 'justificativa', label: 'Justificativa' },
  { id: 'metodologia', label: 'Metodologia' },
  { id: 'metas', label: 'Metas' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'cronograma', label: 'Cronograma' },
  { id: 'orcamento', label: 'Financeiro' },
];

const money = value => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const slugify = value => String(value || 'projeto')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

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
  const activeProposal = normalizeProposal(proposalsList[proposalId] || createEmptyProposal(proposalId), proposalId);
  const edital = editais.find(item => item.id === proposalId) || { titulo: 'Nenhum edital selecionado' };
  const [documentContent, setDocumentContent] = React.useState('');
  const [savedAt, setSavedAt] = React.useState('');
  const [anuenciaMemberId, setAnuenciaMemberId] = React.useState(null);
  const [importError, setImportError] = React.useState('');
  const [importStatus, setImportStatus] = React.useState('');

  const completion = getDossierCompletion(activeProposal);
  const budgetTotal = getBudgetTotal(activeProposal.budget);
  const budgetSummary = getBudgetSummary(activeProposal.budget);
  const fileName = slugify(activeProposal.tituloProjeto || edital.titulo);
  const markdownContent = documentContent || buildProjectMarkdown({ proposal: activeProposal, edital });
  const jsonContent = JSON.stringify({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    edital,
    project: activeProposal,
  }, null, 2);
  const proposalIds = [...new Set([proposalId, ...Object.keys(proposalsList)])].filter(Boolean);

  const updateProposal = (updater) => {
    if (appBridge) {
      const current = normalizeProposal(
        appBridge.state.proposals[proposalId] || createEmptyProposal(proposalId),
        proposalId,
      );
      appBridge.state.proposals[proposalId] = updater(current);
      appBridge.render();
      return;
    }

    setProposals(prev => {
      const current = normalizeProposal(prev[proposalId] || createEmptyProposal(proposalId), proposalId);
      return { ...prev, [proposalId]: updater(current) };
    });
  };

  const handleProposalSelect = (event) => {
    const value = event.target.value;
    setDocumentContent('');
    if (appBridge) {
      appBridge.state.activeProposalEditalId = value;
      appBridge.render();
    } else {
      setActiveProposalEditalId(value);
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

  const handleFieldChange = (field, value) => {
    updateProposal(current => ({ ...current, [field]: value }));
  };

  const handleTextChange = (event) => {
    handleFieldChange(wizardStep, event.target.value);
  };

  const handleGenerateAI = () => {
    const generatedByStep = {
      objetivos: 'Texto gerado automaticamente por IA para a seção Objetivos: democratizar o acesso à cultura e à tecnologia, fortalecer agentes locais e ampliar a circulação da produção regional.',
      justificativa: 'Texto gerado automaticamente por IA. Justificativa: o projeto responde à baixa oferta de formação e circulação cultural nos territórios atendidos, conectando repertório local, inclusão digital e geração de oportunidades.',
      metodologia: 'Texto gerado automaticamente por IA para a seção Metodologia: a execução será organizada em diagnóstico, mobilização, oficinas práticas, acompanhamento de produção e mostra pública de resultados.',
    };
    handleFieldChange(wizardStep, generatedByStep[wizardStep] || '');
  };

  const handleAddBudgetRow = () => {
    updateProposal(current => ({
      ...current,
      budget: [...current.budget, createBudgetItem(Date.now())],
    }));
  };

  const handleDeleteBudgetRow = (rowId) => {
    updateProposal(current => ({
      ...current,
      budget: current.budget.filter(item => item.id !== rowId),
    }));
  };

  const handleBudgetItemChange = (rowId, field, value) => {
    updateProposal(current => ({
      ...current,
      budget: current.budget.map(rawItem => {
        if (rawItem.id !== rowId) return rawItem;
        const item = normalizeBudgetItem(rawItem);
        const numericFields = ['quantidade', 'valorUnitario', 'anoReferencia'];
        const next = {
          ...item,
          [field]: numericFields.includes(field) ? Number(value) : value,
        };
        next.valor = Number(next.quantidade || 0) * Number(next.valorUnitario || 0);
        return next;
      }),
    }));
  };

  const handleBudgetDescChange = (rowId, value) => handleBudgetItemChange(rowId, 'descricao', value);

  const handleBudgetValChange = (rowId, value) => {
    const numericValue = Number(value);
    handleBudgetItemChange(rowId, 'valorUnitario', numericValue);
    if (numericValue < 0) {
      if (appBridge) appBridge.state.errors.budget = 'Valor não pode ser negativo';
      else setErrors(prev => ({ ...prev, budget: 'Valor não pode ser negativo' }));
    } else if (appBridge) {
      delete appBridge.state.errors.budget;
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.budget;
        return next;
      });
    }
  };

  const handleAddScheduleRow = () => {
    updateProposal(current => ({
      ...current,
      schedule: [...current.schedule, { id: Date.now(), tarefa: '', inicio: '', fim: '' }],
    }));
  };

  const handleDeleteScheduleRow = (rowId) => {
    updateProposal(current => ({
      ...current,
      schedule: current.schedule.filter(item => item.id !== rowId),
    }));
  };

  const validateDates = (item) => {
    if (!item.inicio || !item.fim) return;
    const invalid = new Date(item.fim) < new Date(item.inicio);
    if (appBridge) {
      if (invalid) appBridge.state.errors.schedule = 'Fim deve ser após Início';
      else delete appBridge.state.errors.schedule;
      return;
    }
    setErrors(prev => {
      const next = { ...prev };
      if (invalid) next.schedule = 'Fim deve ser após Início';
      else delete next.schedule;
      return next;
    });
  };

  const handleScheduleChange = (rowId, field, value) => {
    let changedItem;
    updateProposal(current => ({
      ...current,
      schedule: current.schedule.map(item => {
        if (item.id !== rowId) return item;
        changedItem = { ...item, [field]: value };
        return changedItem;
      }),
    }));
    if (changedItem && (field === 'inicio' || field === 'fim')) validateDates(changedItem);
  };

  const handleAddTeamMember = () => {
    updateProposal(current => ({
      ...current,
      team: [...current.team, createTeamMember(Date.now())],
    }));
  };

  const handleDeleteTeamMember = (memberId) => {
    if (anuenciaMemberId === memberId) setAnuenciaMemberId(null);
    updateProposal(current => ({
      ...current,
      team: current.team.filter(member => member.id !== memberId),
    }));
  };

  const handleTeamMemberChange = (memberId, field, value) => {
    updateProposal(current => ({
      ...current,
      team: current.team.map(rawMember => {
        if (rawMember.id !== memberId) return rawMember;
        return { ...normalizeTeamMember(rawMember), [field]: value };
      }),
    }));
  };

  const handleGenerateAnuencia = (memberId) => {
    setAnuenciaMemberId(memberId);
  };

  const handleAddGoal = () => {
    updateProposal(current => ({
      ...current,
      goals: [...current.goals, createGoal(Date.now())],
    }));
  };

  const handleDeleteGoal = (goalId) => {
    updateProposal(current => ({
      ...current,
      goals: current.goals.filter(goal => goal.id !== goalId),
    }));
  };

  const handleGoalChange = (goalId, field, value) => {
    updateProposal(current => ({
      ...current,
      goals: current.goals.map(rawGoal => {
        if (rawGoal.id !== goalId) return rawGoal;
        const goal = normalizeGoal(rawGoal);
        return { ...goal, [field]: field === 'quantidade' ? Number(value) : value };
      }),
    }));
  };

  const handleGenerateDocument = () => {
    setDocumentContent(buildProjectMarkdown({ proposal: activeProposal, edital }));
  };

  const applyImportedProject = (project) => {
    const targetId = project?.editalId || proposalId;
    const normalized = normalizeProposal(project, targetId);
    if (appBridge) {
      appBridge.state.proposals[targetId] = normalized;
      appBridge.state.activeProposalEditalId = targetId;
      appBridge.render();
    } else {
      setProposals(prev => ({ ...prev, [targetId]: normalized }));
      setActiveProposalEditalId(targetId);
    }
    setDocumentContent('');
    setAnuenciaMemberId(null);
    setImportError('');
    setImportStatus(`Dossiê importado: ${normalized.tituloProjeto || targetId}`);
  };

  const handleImportJson = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const project = parsed && typeof parsed === 'object' && parsed.project ? parsed.project : parsed;
        if (!project || typeof project !== 'object' || Array.isArray(project)) {
          throw new Error('formato inválido');
        }
        applyImportedProject(project);
      } catch {
        setImportStatus('');
        setImportError('Arquivo JSON inválido. Use um arquivo gerado pelo botão "Exportar dados".');
      }
    };
    reader.onerror = () => {
      setImportStatus('');
      setImportError('Não foi possível ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleSaveProposal = () => {
    setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    if (appBridge) appBridge.render();
  };

  const showTextEditor = ['objetivos', 'justificativa', 'metodologia'].includes(wizardStep);
  const editorValue = activeProposal[wizardStep] || '';
  const anuenciaMember = activeProposal.team.find(member => member.id === anuenciaMemberId);
  const anuenciaContent = anuenciaMember
    ? buildAnuenciaMarkdown({ member: anuenciaMember, proposal: activeProposal, edital })
    : '';
  const anuenciaFileName = `anuencia-${slugify(anuenciaMember?.nome || 'integrante')}`;

  return (
    <div className="module-propostas">
      <div className="proposal-header glass dossier-header">
        <div className="dossier-heading">
          <span className="dossier-eyebrow">Dossiê do projeto</span>
          <h3 id="proposal-edital-title">{activeProposal.tituloProjeto || edital.titulo}</h3>
          <div className="dossier-progress" aria-label={`Dossiê ${completion}% preenchido`}>
            <div className="dossier-progress-track">
              <span style={{ width: `${completion}%` }} />
            </div>
            <span>{completion}% preenchido</span>
          </div>
        </div>
        <div className="proposal-selector">
          <label htmlFor="proposal-edital-select">Alternar dossiê</label>
          <select id="proposal-edital-select" value={proposalId} onChange={handleProposalSelect}>
            {proposalIds.map(id => {
              const proposal = normalizeProposal(proposalsList[id], id);
              const sourceEdital = editais.find(item => item.id === id) || { titulo: id };
              return <option key={id} value={id}>{proposal.tituloProjeto || sourceEdital.titulo}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="proposal-wizard">
        <nav className="wizard-nav" aria-label="Seções do dossiê">
          {WIZARD_STEPS.map(step => (
            <button
              key={step.id}
              className={`wizard-step ${wizardStep === step.id ? 'active' : ''}`}
              data-step={step.id}
              onClick={() => handleStepClick(step.id)}
            >
              {step.label}
            </button>
          ))}
        </nav>

        <div className="wizard-content glass">
          {wizardStep === 'resumo' && (
            <div className="dossier-overview">
              <div className="dossier-form-grid">
                <div className="form-group dossier-field-wide">
                  <label htmlFor="project-title">Título do projeto</label>
                  <input id="project-title" value={activeProposal.tituloProjeto} onChange={event => handleFieldChange('tituloProjeto', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="project-area">Área principal</label>
                  <select id="project-area" value={activeProposal.areaProjeto} onChange={event => handleFieldChange('areaProjeto', event.target.value)}>
                    {PROJECT_AREA_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="project-status">Status</label>
                  <select id="project-status" value={activeProposal.statusProjeto} onChange={event => handleFieldChange('statusProjeto', event.target.value)}>
                    {PROJECT_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="form-group dossier-field-wide">
                  <label htmlFor="project-idea">Ideia central</label>
                  <textarea id="project-idea" rows="4" value={activeProposal.ideiaCentral} onChange={event => handleFieldChange('ideiaCentral', event.target.value)} />
                </div>
                <div className="form-group dossier-field-wide">
                  <label htmlFor="project-synopsis">Sinopse</label>
                  <textarea id="project-synopsis" rows="5" value={activeProposal.sinopse} onChange={event => handleFieldChange('sinopse', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="project-proponent">Proponente</label>
                  <input id="project-proponent" value={activeProposal.proponente} onChange={event => handleFieldChange('proponente', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="project-owner">Responsável</label>
                  <input id="project-owner" value={activeProposal.responsavel} onChange={event => handleFieldChange('responsavel', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="project-territory">Território</label>
                  <input id="project-territory" value={activeProposal.territorio} onChange={event => handleFieldChange('territorio', event.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="project-duration">Duração em meses</label>
                  <input id="project-duration" type="number" min="1" value={activeProposal.duracaoMeses} onChange={event => handleFieldChange('duracaoMeses', Number(event.target.value))} />
                </div>
                <div className="form-group dossier-field-wide">
                  <label htmlFor="project-audience">Público-alvo</label>
                  <input id="project-audience" value={activeProposal.publicoAlvo} onChange={event => handleFieldChange('publicoAlvo', event.target.value)} />
                </div>
              </div>
            </div>
          )}

          {showTextEditor && (
            <div className="text-editor-container">
              <textarea
                id="rich-text-editor"
                rows="12"
                placeholder="Escreva o conteúdo desta seção..."
                value={editorValue}
                onChange={handleTextChange}
              />
              <button id="btn-generate-ai" onClick={handleGenerateAI}>
                <Sparkles size={17} />
                Gerar base com IA
              </button>
            </div>
          )}

          {wizardStep === 'metas' && (
            <div className="goals-editor-container">
              <div className="budget-heading">
                <div>
                  <h4>Metas e indicadores</h4>
                  <span>{activeProposal.goals.length} metas cadastradas</span>
                </div>
              </div>
              <p className="goals-hint">
                Defina o que será entregue, como medir e a fonte de comprovação. Esse quadro acompanha a
                execução do projeto e a prestação de contas.
              </p>
              <div className="budget-table-scroll">
                <table className="goals-table">
                  <thead>
                    <tr>
                      <th>Meta</th>
                      <th>Indicador</th>
                      <th>Quantidade</th>
                      <th>Unidade</th>
                      <th>Meio de verificação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProposal.goals.map(rawGoal => {
                      const goal = normalizeGoal(rawGoal);
                      return (
                        <tr key={goal.id} data-row-id={goal.id}>
                          <td><input type="text" className="goal-desc" value={goal.descricao} onChange={event => handleGoalChange(goal.id, 'descricao', event.target.value)} /></td>
                          <td><input type="text" className="goal-indicator" value={goal.indicador} onChange={event => handleGoalChange(goal.id, 'indicador', event.target.value)} /></td>
                          <td><input type="number" min="0" step="1" className="goal-qty" value={goal.quantidade} onChange={event => handleGoalChange(goal.id, 'quantidade', event.target.value)} /></td>
                          <td><input type="text" className="goal-unit" value={goal.unidade} onChange={event => handleGoalChange(goal.id, 'unidade', event.target.value)} placeholder="pessoas, oficinas..." /></td>
                          <td><input type="text" className="goal-verification" value={goal.meioVerificacao} onChange={event => handleGoalChange(goal.id, 'meioVerificacao', event.target.value)} placeholder="lista de presença, fotos..." /></td>
                          <td><button className="btn-delete-goal-row" data-id={goal.id} onClick={() => handleDeleteGoal(goal.id)}>Excluir</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button id="btn-add-goal-row" onClick={handleAddGoal}>Adicionar meta</button>
            </div>
          )}

          {wizardStep === 'equipe' && (
            <div className="team-editor-container">
              <div className="budget-heading">
                <div>
                  <h4>Equipe do projeto</h4>
                  <span>{activeProposal.team.length} integrantes cadastrados</span>
                </div>
              </div>

              {activeProposal.team.length === 0 && (
                <p className="team-empty">
                  Nenhum integrante na equipe. Clique em “Adicionar à equipe” para incluir uma pessoa,
                  preencher os dados e gerar o termo de anuência dela.
                </p>
              )}

              <div className="team-list">
                {activeProposal.team.map(rawMember => {
                  const member = normalizeTeamMember(rawMember);
                  return (
                    <div key={member.id} className="team-member-card glass" data-member-id={member.id}>
                      <div className="team-member-grid">
                        <div className="form-group team-field-wide">
                          <label>Nome completo</label>
                          <input className="team-member-nome" value={member.nome} onChange={event => handleTeamMemberChange(member.id, 'nome', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Função no projeto</label>
                          <select className="team-member-funcao" value={member.funcao} onChange={event => handleTeamMemberChange(member.id, 'funcao', event.target.value)}>
                            {TEAM_ROLE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Vínculo</label>
                          <select className="team-member-vinculo" value={member.vinculo} onChange={event => handleTeamMemberChange(member.id, 'vinculo', event.target.value)}>
                            {TEAM_LINK_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>CPF</label>
                          <input className="team-member-cpf" value={member.cpf} onChange={event => handleTeamMemberChange(member.id, 'cpf', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>RG</label>
                          <input className="team-member-rg" value={member.rg} onChange={event => handleTeamMemberChange(member.id, 'rg', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Cidade</label>
                          <input className="team-member-cidade" value={member.cidade} onChange={event => handleTeamMemberChange(member.id, 'cidade', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>E-mail</label>
                          <input type="email" className="team-member-email" value={member.email} onChange={event => handleTeamMemberChange(member.id, 'email', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Telefone</label>
                          <input className="team-member-telefone" value={member.telefone} onChange={event => handleTeamMemberChange(member.id, 'telefone', event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Data da anuência</label>
                          <input type="date" className="team-member-data" value={member.dataAnuencia} onChange={event => handleTeamMemberChange(member.id, 'dataAnuencia', event.target.value)} />
                        </div>
                        <div className="form-group team-anuencia-field">
                          <label className="team-checkbox">
                            <input type="checkbox" className="team-member-anuencia" checked={member.anuencia} onChange={event => handleTeamMemberChange(member.id, 'anuencia', event.target.checked)} />
                            Anuência registrada
                          </label>
                        </div>
                      </div>
                      <div className="team-member-actions">
                        <button className="btn-generate-anuencia secondary-action" onClick={() => handleGenerateAnuencia(member.id)}>
                          <FileText size={16} />
                          Gerar anuência
                        </button>
                        <button className="btn-delete-team-member" data-id={member.id} onClick={() => handleDeleteTeamMember(member.id)}>Excluir</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button id="btn-add-team-member" onClick={handleAddTeamMember}>Adicionar à equipe</button>

              {anuenciaMember && (
                <div className="anuencia-panel glass">
                  <div className="anuencia-panel-header">
                    <h4>Termo de anuência — {anuenciaMember.nome || 'integrante'}</h4>
                    <a className="dossier-export-link" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(anuenciaContent)}`} download={`${anuenciaFileName}.md`}>
                      <Download size={16} />
                      Baixar anuência
                    </a>
                  </div>
                  <pre id="anuencia-output" className="dossier-document-output">{anuenciaContent}</pre>
                </div>
              )}
            </div>
          )}

          {wizardStep === 'orcamento' && (
            <div className="budget-editor-container">
              <div className="budget-heading">
                <div>
                  <h4>Planejamento financeiro</h4>
                  <span>{activeProposal.budget.length} itens cadastrados</span>
                </div>
                <strong>{money(budgetTotal)}</strong>
              </div>

              {Object.keys(budgetSummary).length > 0 && (
                <div className="budget-summary" aria-label="Resumo financeiro por categoria">
                  {Object.entries(budgetSummary).map(([category, total]) => (
                    <div key={category} className="budget-summary-item">
                      <span>{BUDGET_CATEGORY_OPTIONS.find(option => option.value === category)?.label || category}</span>
                      <strong>{money(total)}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="budget-table-scroll">
                <table className="budget-table budget-table--detailed">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Área financeira</th>
                      <th>Status</th>
                      <th>Unidade</th>
                      <th>Qtd.</th>
                      <th>Valor unitário</th>
                      <th>Frequência</th>
                      <th>Mês</th>
                      <th>Ano</th>
                      <th>Fonte</th>
                      <th>Total</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProposal.budget.map(rawItem => {
                      const item = normalizeBudgetItem(rawItem);
                      return (
                        <tr key={item.id} data-row-id={item.id}>
                          <td><input type="text" className="budget-desc" value={item.descricao} onChange={event => handleBudgetDescChange(item.id, event.target.value)} /></td>
                          <td>
                            <select className="budget-category" value={item.categoria} onChange={event => handleBudgetItemChange(item.id, 'categoria', event.target.value)}>
                              {BUDGET_CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="budget-status" value={item.status} onChange={event => handleBudgetItemChange(item.id, 'status', event.target.value)}>
                              {BUDGET_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="budget-unit" value={item.unidadeMedida} onChange={event => handleBudgetItemChange(item.id, 'unidadeMedida', event.target.value)}>
                              {UNIT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </td>
                          <td><input type="number" min="0" step="0.01" className="budget-qty" value={item.quantidade} onChange={event => handleBudgetItemChange(item.id, 'quantidade', event.target.value)} /></td>
                          <td>
                            <input type="number" min="0" step="0.01" className="budget-val" value={item.valorUnitario} onChange={event => handleBudgetValChange(item.id, event.target.value)} />
                            {(item.valorUnitario < 0 || item.valor < 0) && <span className="validation-error">Valor não pode ser negativo</span>}
                          </td>
                          <td>
                            <select className="budget-frequency" value={item.frequencia} onChange={event => handleBudgetItemChange(item.id, 'frequencia', event.target.value)}>
                              {FREQUENCY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </td>
                          <td><input type="month" className="budget-month" value={item.mesReferencia} onChange={event => handleBudgetItemChange(item.id, 'mesReferencia', event.target.value)} /></td>
                          <td><input type="number" min="2020" max="2100" className="budget-year" value={item.anoReferencia} onChange={event => handleBudgetItemChange(item.id, 'anoReferencia', event.target.value)} /></td>
                          <td>
                            <select className="budget-source" value={item.fonteRecurso} onChange={event => handleBudgetItemChange(item.id, 'fonteRecurso', event.target.value)}>
                              {FUNDING_SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                          </td>
                          <td><output className="budget-row-total">{money(item.valor)}</output></td>
                          <td><button className="btn-delete-budget-row" data-id={item.id} onClick={() => handleDeleteBudgetRow(item.id)}>Excluir</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button id="btn-add-budget-row" onClick={handleAddBudgetRow}>Adicionar item financeiro</button>
              {currentErrors.budget && <div className="error-message" id="budget-error-msg">{currentErrors.budget}</div>}
            </div>
          )}

          {wizardStep === 'cronograma' && (
            <div className="schedule-editor-container">
              <h4>Cronograma de atividades</h4>
              <table className="schedule-table">
                <thead>
                  <tr><th>Atividade</th><th>Data de início</th><th>Data de fim</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {activeProposal.schedule.map(item => {
                    const isInvalid = item.inicio && item.fim && new Date(item.fim) < new Date(item.inicio);
                    return (
                      <tr key={item.id} data-row-id={item.id}>
                        <td><input type="text" className="schedule-task" value={item.tarefa} onChange={event => handleScheduleChange(item.id, 'tarefa', event.target.value)} /></td>
                        <td><input type="date" className="schedule-start" value={item.inicio} onChange={event => handleScheduleChange(item.id, 'inicio', event.target.value)} /></td>
                        <td>
                          <input type="date" className="schedule-end" value={item.fim} onChange={event => handleScheduleChange(item.id, 'fim', event.target.value)} />
                          {isInvalid && <span className="validation-error">Fim deve ser após Início</span>}
                        </td>
                        <td><button className="btn-delete-schedule-row" data-id={item.id} onClick={() => handleDeleteScheduleRow(item.id)}>Excluir</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button id="btn-add-schedule-row" onClick={handleAddScheduleRow}>Adicionar atividade</button>
              {currentErrors.schedule && <div className="error-message" id="schedule-error-msg">{currentErrors.schedule}</div>}
            </div>
          )}
        </div>

        <div className="wizard-footer dossier-actions">
          <button id="btn-save-proposal" onClick={handleSaveProposal}>Salvar Proposta</button>
          {savedAt && <span className="dossier-save-status">Salvo às {savedAt}</span>}
          <button id="btn-generate-document" className="secondary-action" onClick={handleGenerateDocument}>
            <FileText size={17} />
            Gerar documento
          </button>
          <a className="dossier-export-link" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdownContent)}`} download={`${fileName}.md`}>
            <Download size={17} />
            Baixar documento
          </a>
          <a className="dossier-export-link" href={`data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`} download={`${fileName}.json`}>
            <FileJson size={17} />
            Exportar dados
          </a>
          <label className="dossier-export-link dossier-import-link" htmlFor="import-json-input">
            <Upload size={17} />
            Importar dados
            <input id="import-json-input" type="file" accept="application/json,.json" onChange={handleImportJson} hidden />
          </label>
        </div>

        {importStatus && <div className="dossier-save-status dossier-import-status" id="import-status-msg">{importStatus}</div>}
        {importError && <div className="error-message dossier-import-error" id="import-error-msg">{importError}</div>}

        {documentContent && <pre id="dossier-document-output" className="dossier-document-output">{documentContent}</pre>}
      </div>
    </div>
  );
}
