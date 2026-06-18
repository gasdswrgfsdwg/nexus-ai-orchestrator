import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import App from '../../src/App';

export class SimulatedApp {
  constructor() {
    this.state = {
      editais: [
        { id: 'e1', titulo: 'Edital de Inovação Tecnológica FINEP', orgao: 'FINEP', prazo: '2026-12-01', valor: 500000, categoria: 'inovação', score: 85, status: 'aberto' },
        { id: 'e2', titulo: 'Prêmio de Fomento à Cultura Lei Rouanet', orgao: 'MinC', prazo: '2026-10-15', valor: 250000, categoria: 'cultura', score: 90, status: 'aberto' },
        { id: 'e3', titulo: 'Projetos de Inclusão Social Fundo Social', orgao: 'Fundo Social', prazo: '2026-09-30', valor: 100000, categoria: 'social', score: 70, status: 'aberto' },
        { id: 'e4', titulo: 'Subvenção Econômica de Inovação', orgao: 'FAPESP', prazo: '2026-11-20', valor: 300000, categoria: 'inovação', score: 80, status: 'aberto' },
        { id: 'e5', titulo: 'Artes Cênicas nas Escolas', orgao: 'Funarte', prazo: '2026-08-05', valor: 80000, categoria: 'cultura', score: 65, status: 'aberto' },
        { id: 'e6', titulo: 'Apoio a Cooperativas Locais', orgao: 'Sebrae', prazo: '2026-07-22', valor: 150000, categoria: 'social', score: 75, status: 'aberto' },
        { id: 'e7', titulo: 'Desenvolvimento de Jogos Educativos', orgao: 'MinC', prazo: '2026-05-01', valor: 120000, categoria: 'cultura', score: 60, status: 'fechado' },
        { id: 'e8', titulo: 'Inteligência Artificial para Saúde', orgao: 'CNPq', prazo: '2026-11-15', valor: 600000, categoria: 'inovação', score: 88, status: 'aberto' },
        { id: 'e9', titulo: 'Esporte Solidário', orgao: 'Secretaria de Esportes', prazo: '2026-09-10', valor: 90000, categoria: 'social', score: 55, status: 'aberto' },
        { id: 'e10', titulo: 'Preservação Histórica', orgao: 'IPHAN', prazo: '2026-10-01', valor: 200000, categoria: 'cultura', score: 72, status: 'aberto' },
        { id: 'e11', titulo: 'Pesquisa Básica', orgao: 'CNPq', prazo: '2026-08-31', valor: 50000, categoria: 'inovação', score: 50, status: 'aberto' },
      ],
      userProfile: {
        keywords: ['tecnologia', 'cultura', 'social'],
        area: 'geral',
        maxOrcamento: 1000000
      },
      activeModule: 'editais',
      activeWizardStep: 'objetivos',
      activeProposalEditalId: 'e2',
      proposals: {
        e2: {
          editalId: 'e2',
          objetivos: 'Objetivos iniciais da proposta de cultura.',
          justificativa: 'Justificativa para captação Lei Rouanet.',
          metodologia: 'Metodologia de execução do plano cultural.',
          budget: [
            { id: 1, descricao: 'Recursos Humanos', valor: 150000 },
            { id: 2, descricao: 'Logística e Locações', valor: 100000 }
          ],
          schedule: [
            { id: 1, tarefa: 'Fase de Planejamento', inicio: '2026-11-01', fim: '2026-11-30' },
            { id: 2, tarefa: 'Produção e Execução', inicio: '2026-12-01', fim: '2027-04-30' }
          ]
        }
      },
      projects: [
        { id: 'p1', editalId: 'e2', editalNome: 'Prêmio de Fomento à Cultura Lei Rouanet', prazo: '2026-10-15', documentosCompletosPercent: 50, estagio: 'Em Elaboração', agenteAtribuido: 'Gemini CLI' },
        { id: 'p2', editalId: 'e1', editalNome: 'Edital de Inovação Tecnológica FINEP', prazo: '2026-12-01', documentosCompletosPercent: 20, estagio: 'Rascunho', agenteAtribuido: 'Claude Code' }
      ],
      posAprovacao: {},
      currentFilterCategory: 'todas',
      currentSearchTerm: '',
      errors: {},
      viewportWidth: 1024,
      fontSizeScale: 1.0,
      logs: []
    };
    this.container = null;
    this.root = null;
    this.updateReactState = null;
  }

  mount(container) {
    this.container = container;
    this.root = createRoot(container);
    this.render();
  }

  unmount() {
    if (this.root) {
      this.root.unmount();
    }
  }

  recalculateScores() {
    const { keywords, area, maxOrcamento } = this.state.userProfile;
    
    this.state.editais.forEach(edital => {
      if (!keywords || keywords.length === 0 || (keywords.length === 1 && keywords[0] === '')) {
        edital.score = 50;
        return;
      }

      let score = 50;
      
      if (edital.valor > maxOrcamento) {
        score -= 20;
      } else {
        score += 10;
      }

      let matches = 0;
      keywords.forEach(kw => {
        if (kw && (edital.titulo.toLowerCase().includes(kw.toLowerCase()) || 
                   edital.orgao.toLowerCase().includes(kw.toLowerCase()))) {
          matches++;
        }
      });
      score += matches * 15;

      if (area && area !== 'geral' && edital.categoria.toLowerCase() === area.toLowerCase()) {
        score += 20;
      }

      edital.score = Math.max(0, Math.min(100, score));
    });
  }

  moveProject(projId, destStage) {
    const project = this.state.projects.find(p => p.id === projId);
    if (!project) return false;

    const validStages = ['Rascunho', 'Em Elaboração', 'Revisão Interna', 'Pronto para Submissão', 'Submetido', 'Aprovado', 'Reprovado'];
    if (!validStages.includes(destStage)) {
      return false;
    }

    if (project.estagio === 'Rascunho' && destStage === 'Aprovado') {
      return false;
    }

    project.estagio = destStage;
    this.render();
    return true;
  }

  validateDates(item) {
    if (item.inicio && item.fim) {
      if (new Date(item.fim) < new Date(item.inicio)) {
        this.state.errors.schedule = 'Fim deve ser após Início';
      } else {
        delete this.state.errors.schedule;
      }
      this.render();
    }
  }

  bindDirectEvents() {
    if (!this.container) return;

    const bindOnce = (selector, event, handler) => {
      const elements = this.container.querySelectorAll(selector);
      elements.forEach(el => {
        const key = `_has_${event}_listener`;
        if (!el[key]) {
          el.addEventListener(event, handler);
          el[key] = true;
        }
      });
    };

    // Navigation
    const navs = ['editais', 'propostas', 'kanban', 'pos-aprovacao'];
    navs.forEach(mod => {
      bindOnce(`#nav-${mod}`, 'click', () => {
        this.state.activeModule = mod;
        this.render();
      });
    });

    // Profile Settings
    bindOnce('#profile-keywords', 'change', (e) => {
      this.state.userProfile.keywords = e.target.value.split(',').map(s => s.trim());
      this.recalculateScores();
      this.render();
    });

    bindOnce('#profile-budget', 'change', (e) => {
      this.state.userProfile.maxOrcamento = Number(e.target.value);
      this.recalculateScores();
      this.render();
    });

    bindOnce('#profile-area', 'change', (e) => {
      this.state.userProfile.area = e.target.value;
      this.recalculateScores();
      this.render();
    });

    bindOnce('#save-profile', 'click', () => {
      this.recalculateScores();
      this.render();
    });

    // Search & Filters
    bindOnce('#editais-search', 'input', (e) => {
      this.state.currentSearchTerm = e.target.value;
      this.render();
    });

    bindOnce('.filter-category', 'click', (e) => {
      this.state.currentFilterCategory = e.target.dataset.category;
      this.render();
    });

    bindOnce('.btn-create-proposal', 'click', (e) => {
      const id = e.target.dataset.id;
      if (!this.state.proposals[id]) {
        this.state.proposals[id] = {
          editalId: id,
          objetivos: '',
          justificativa: '',
          metodologia: '',
          budget: [],
          schedule: []
        };
      }
      this.state.activeProposalEditalId = id;
      this.state.activeModule = 'propostas';
      this.render();
    });

    // Proposal Select & Wizard Steps
    bindOnce('#proposal-edital-select', 'change', (e) => {
      this.state.activeProposalEditalId = e.target.value;
      this.render();
    });

    bindOnce('.wizard-step', 'click', (e) => {
      this.state.activeWizardStep = e.target.dataset.step;
      this.render();
    });

    bindOnce('#rich-text-editor', 'input', (e) => {
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        proposal[this.state.activeWizardStep] = e.target.value;
      }
    });

    bindOnce('#btn-generate-ai', 'click', () => {
      const step = this.state.activeWizardStep;
      let generated = '';
      if (step === 'objetivos') {
        generated = 'Texto gerado automaticamente por IA para a seção Objetivos: Este projeto visa democratizar o acesso à tecnologia e à cultura regional.';
      } else if (step === 'justificativa') {
        generated = 'Texto gerado automaticamente por IA para a seção Justificativa: Justifica-se pela escassez de iniciativas integradas na região periférica.';
      } else if (step === 'metodologia') {
        generated = 'Texto gerado automaticamente por IA para a seção Metodologia: A metodologia compreende 4 fases principais de workshop e mentoria.';
      }
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        proposal[step] = generated;
      }
      this.render();
    });

    // Budget Editor
    bindOnce('#btn-add-budget-row', 'click', () => {
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        proposal.budget.push({ id: Date.now(), descricao: '', valor: 0 });
        this.render();
      }
    });

    bindOnce('.budget-desc', 'change', (e) => {
      const rowId = Number(e.target.closest('tr').dataset.rowId);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        const item = proposal.budget.find(i => i.id === rowId);
        if (item) item.descricao = e.target.value;
      }
    });

    bindOnce('.budget-val', 'change', (e) => {
      const rowId = Number(e.target.closest('tr').dataset.rowId);
      const val = Number(e.target.value);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        const item = proposal.budget.find(i => i.id === rowId);
        if (item) {
          item.valor = val;
          if (val < 0) {
            this.state.errors.budget = 'Valor não pode ser negativo';
          } else {
            delete this.state.errors.budget;
          }
          this.render();
        }
      }
    });

    bindOnce('.btn-delete-budget-row', 'click', (e) => {
      const id = Number(e.target.dataset.id);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        proposal.budget = proposal.budget.filter(i => i.id !== id);
        this.render();
      }
    });

    // Schedule Editor
    bindOnce('#btn-add-schedule-row', 'click', () => {
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        proposal.schedule.push({ id: Date.now(), tarefa: '', inicio: '', fim: '' });
        this.render();
      }
    });

    bindOnce('.schedule-task', 'change', (e) => {
      const rowId = Number(e.target.closest('tr').dataset.rowId);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        const item = proposal.schedule.find(i => i.id === rowId);
        if (item) item.tarefa = e.target.value;
      }
    });

    bindOnce('.schedule-start', 'change', (e) => {
      const rowId = Number(e.target.closest('tr').dataset.rowId);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        const item = proposal.schedule.find(i => i.id === rowId);
        if (item) {
          item.inicio = e.target.value;
          this.validateDates(item);
        }
      }
    });

    bindOnce('.schedule-end', 'change', (e) => {
      const rowId = Number(e.target.closest('tr').dataset.rowId);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        const item = proposal.schedule.find(i => i.id === rowId);
        if (item) {
          item.fim = e.target.value;
          this.validateDates(item);
        }
      }
    });

    bindOnce('.btn-delete-schedule-row', 'click', (e) => {
      const id = Number(e.target.dataset.id);
      const proposal = this.state.proposals[this.state.activeProposalEditalId];
      if (proposal) {
        proposal.schedule = proposal.schedule.filter(i => i.id !== id);
        this.render();
      }
    });

    // Kanban
    bindOnce('.doc-chk', 'change', (e) => {
      const target = e.target;
      const projId = target.dataset.projId;
      const project = this.state.projects.find(p => p.id === projId);
      if (project) {
        const projectChks = this.container.querySelectorAll(`.doc-chk[data-proj-id="${projId}"]`);
        const checkedCount = Array.from(projectChks).filter(c => c.checked).length;
        project.documentosCompletosPercent = Math.round((checkedCount / 3) * 100);
        this.render();
      }
    });

    // Post Approval Select
    bindOnce('#approved-project-select', 'change', (e) => {
      this.state.selectedApprovedProjectId = e.target.value;
      this.render();
    });

    bindOnce('.btn-delete-rubric', 'click', (e) => {
      const rubricId = Number(e.target.dataset.id);
      const projId = this.state.selectedApprovedProjectId;
      const data = this.state.posAprovacao[projId];
      if (data) {
        data.rubrics = data.rubrics.filter(r => r.id !== rubricId);
        this.render();
      }
    });

    bindOnce('.add-transaction-form', 'submit', (e) => {
      e.preventDefault();
      const desc = this.container.querySelector('#tx-desc').value;
      const val = Number(this.container.querySelector('#tx-val').value);
      const rubricId = Number(this.container.querySelector('#tx-rubric-select').value);
      const projId = this.state.selectedApprovedProjectId;
      const data = this.state.posAprovacao[projId];
      
      if (data) {
        const rubric = data.rubrics.find(r => r.id === rubricId);
        if (rubric) {
          rubric.gasto += val;
          data.transactions.push({ id: Date.now(), rubricId, descricao: desc, valor: val });
          this.render();
        }
      }
    });

    bindOnce('.obligation-chk', 'change', (e) => {
      const obId = Number(e.target.dataset.obId);
      const projId = this.state.selectedApprovedProjectId;
      const data = this.state.posAprovacao[projId];
      if (data) {
        const obligation = data.obligations.find(o => o.id === obId);
        if (obligation) {
          obligation.concluida = e.target.checked;
        }
      }
    });

    bindOnce('#btn-export-report', 'click', () => {
      const projId = this.state.selectedApprovedProjectId;
      const proj = this.state.projects.find(p => p.id === projId);
      const data = this.state.posAprovacao[projId];
      let md = '';
      if (!proj || !data || data.rubrics.length === 0) {
        md = '# Relatório de Prestação de Contas\n\nEstrutura padrão limpa. Nenhum dado de projeto disponível.';
      } else {
        const totalPlanejado = data.rubrics.reduce((acc, r) => acc + r.planejado, 0);
        const totalGasto = data.rubrics.reduce((acc, r) => acc + r.gasto, 0);
        md = `# Relatório de Prestação de Contas\n\n` +
             `**Projeto:** ${proj.editalNome}\n` +
             `**Orçamento Planejado:** R$ ${totalPlanejado.toLocaleString('pt-BR')}\n` +
             `**Orçamento Realizado:** R$ ${totalGasto.toLocaleString('pt-BR')}\n` +
             `**Saldo Atual:** R$ ${(totalPlanejado - totalGasto).toLocaleString('pt-BR')}\n\n` +
             `## Demonstrativo por Rubrica\n` +
             data.rubrics.map(r => `- **${r.descricao}**: Planejado R$ ${r.planejado.toLocaleString('pt-BR')} | Gasto R$ ${r.gasto.toLocaleString('pt-BR')}`).join('\n') +
             `\n\n## Histórico de Transações\n` +
             data.transactions.map(t => `- ${t.descricao}: R$ ${t.valor.toLocaleString('pt-BR')}`).join('\n');
      }
      const output = this.container.querySelector('#export-output');
      if (output) {
        output.textContent = md;
        output.style.display = 'block';
      }
    });
  }

  render() {
    // Synchronously initialize posAprovacao for any approved projects
    const approved = this.state.projects.filter(p => p.estagio === 'Aprovado');
    approved.forEach(proj => {
      if (!this.state.posAprovacao[proj.id]) {
        const proposal = this.state.proposals[proj.editalId] || { budget: [] };
        const budget = proposal.budget && proposal.budget.length > 0
          ? proposal.budget
          : [
              { id: 1, descricao: 'Recursos Humanos', valor: 150000 },
              { id: 2, descricao: 'Logística', valor: 100000 }
            ];

        this.state.posAprovacao[proj.id] = {
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
      }
    });

    if (approved.length > 0 && !this.state.selectedApprovedProjectId) {
      this.state.selectedApprovedProjectId = approved[0].id;
    }

    if (this.container) {
      const layoutClass = this.state.viewportWidth < 768 ? 'layout-tablet' : 'layout-desktop';
      this.container.className = `app-wrapper ${layoutClass}`;
      this.container.style.fontSize = `${this.state.fontSizeScale}em`;
    }

    if (this.root) {
      if (this.updateReactState) {
        flushSync(() => {
          this.updateReactState(this.state);
        });
      } else {
        flushSync(() => {
          this.root.render(
            <App appBridge={this} />
          );
        });
      }
    }

    // Bind direct listeners to the newly rendered DOM elements
    this.bindDirectEvents();
  }
}
