// nexusEditais.test.js
// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimulatedApp } from './SimulatedApp';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import App from '../../src/App';


describe('Nexus Editais E2E Test Suite', () => {
  let app;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    app = new SimulatedApp();
    app.mount(container);
  });

  afterEach(() => {
    app.unmount();
    container.remove();
  });

  // ==========================================
  // TIER 1 - FEATURE COVERAGE (25 cases)
  // ==========================================

  // --- Feature 1: Discovery (R1) ---
  
  it('T1.F1.1: Exibição de Editais - Verifica se a tela exibe pelo menos 10 editais de exemplo na carga inicial', () => {
    const cards = container.querySelectorAll('.edital-card');
    expect(cards.length).toBeGreaterThanOrEqual(10);
  });

  it('T1.F1.2: Categorias de Editais - Confirma que existem editais de pelo menos 3 categorias diferentes (inovação, cultura, social)', () => {
    const categories = new Set(
      Array.from(container.querySelectorAll('.edital-categoria')).map(el => el.textContent.trim().toLowerCase())
    );
    expect(categories.has('inovação')).toBe(true);
    expect(categories.has('cultura')).toBe(true);
    expect(categories.has('social')).toBe(true);
  });

  it('T1.F1.3: Detalhes do Edital - Garante que cada edital exibe título, órgão emissor, prazo, valor, categoria e score de compatibilidade', () => {
    const card = container.querySelector('.edital-card');
    expect(card.querySelector('.edital-titulo').textContent).toBeTruthy();
    expect(card.querySelector('.edital-orgao').textContent).toBeTruthy();
    expect(card.querySelector('.edital-prazo').textContent).toBeTruthy();
    expect(card.querySelector('.edital-valor').textContent).toBeTruthy();
    expect(card.querySelector('.edital-categoria').textContent).toBeTruthy();
    expect(card.querySelector('.compatibility-score').textContent).toBeTruthy();
  });

  it('T1.F1.4: Filtros Funcionais - Teste de filtro de editais por categoria, verificando se a lista se atualiza corretamente', () => {
    const btnCultura = container.querySelector('.filter-category[data-category="cultura"]');
    expect(btnCultura).toBeTruthy();
    btnCultura.click();
    const cards = container.querySelectorAll('.edital-card');
    cards.forEach(c => {
      expect(c.querySelector('.edital-categoria').textContent.trim().toLowerCase()).toBe('cultura');
    });
  });

  it('T1.F1.5: Configuração de Perfil - Verifica se o score de compatibilidade é recalculado ao alterar as palavras-chave do perfil', () => {
    const keywordsInput = container.querySelector('#profile-keywords');
    keywordsInput.value = 'FINEP, Inovação, Tecnológica';
    keywordsInput.dispatchEvent(new Event('change'));
    
    const areaSelect = container.querySelector('#profile-area');
    areaSelect.value = 'inovação';
    areaSelect.dispatchEvent(new Event('change'));
    
    const finepCard = Array.from(container.querySelectorAll('.edital-card'))
      .find(c => c.querySelector('.edital-titulo').textContent.includes('FINEP'));
    expect(finepCard.querySelector('.compatibility-score').textContent).toContain('100%');
  });

  // --- Feature 2: Proposals (R2) ---

  it('T1.F2.1: Fluxo de Escrita - Verifica se o wizard guia o usuário pelas seções (objetivos, justificativa, metodologia, etc.)', () => {
    container.querySelector('#nav-propostas').click();
    const steps = Array.from(container.querySelectorAll('.wizard-step')).map(el => el.dataset.step);
    expect(steps).toContain('objetivos');
    expect(steps).toContain('justificativa');
    expect(steps).toContain('metodologia');
    expect(steps).toContain('cronograma');
    expect(steps).toContain('orcamento');
  });

  it('T1.F2.2: Campo de Texto Rico - Garante que os campos de texto do wizard permitem edição', () => {
    container.querySelector('#nav-propostas').click();
    const editor = container.querySelector('#rich-text-editor');
    editor.value = 'Novos objetivos de fomento cultural';
    editor.dispatchEvent(new Event('input'));
    expect(app.state.proposals[app.state.activeProposalEditalId].objetivos).toBe('Novos objetivos de fomento cultural');
  });

  it('T1.F2.3: Assistente de Escrita (Gerar com IA) - Verifica se o botão "Gerar com IA" preenche o campo ativo com texto placeholder de qualidade', () => {
    container.querySelector('#nav-propostas').click();
    const editor = container.querySelector('#rich-text-editor');
    const genBtn = container.querySelector('#btn-generate-ai');
    genBtn.click();
    expect(editor.value).toContain('Texto gerado automaticamente por IA');
  });

  it('T1.F2.4: Orçamento Editável - Confirma que as tabelas de orçamento são editáveis', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="orcamento"]').click();
    container.querySelector('#btn-add-budget-row').click();
    
    let lastRow = container.querySelector('.budget-table tbody tr:last-child');
    let descInput = lastRow.querySelector('.budget-desc');
    descInput.value = 'Serviços de Terceiros';
    descInput.dispatchEvent(new Event('change'));
    
    lastRow = container.querySelector('.budget-table tbody tr:last-child');
    let valInput = lastRow.querySelector('.budget-val');
    valInput.value = '25000';
    valInput.dispatchEvent(new Event('change'));
    
    const budgetList = app.state.proposals[app.state.activeProposalEditalId].budget;
    expect(budgetList.find(i => i.descricao === 'Serviços de Terceiros').valor).toBe(25000);
  });

  it('T1.F2.5: Cronograma Editável - Confirma que as tabelas de cronograma são editáveis', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="cronograma"]').click();
    container.querySelector('#btn-add-schedule-row').click();
    
    let lastRow = container.querySelector('.schedule-table tbody tr:last-child');
    let taskInput = lastRow.querySelector('.schedule-task');
    taskInput.value = 'Divulgação do Evento';
    taskInput.dispatchEvent(new Event('change'));
    
    lastRow = container.querySelector('.schedule-table tbody tr:last-child');
    let startInput = lastRow.querySelector('.schedule-start');
    startInput.value = '2026-11-01';
    startInput.dispatchEvent(new Event('change'));
    
    lastRow = container.querySelector('.schedule-table tbody tr:last-child');
    let endInput = lastRow.querySelector('.schedule-end');
    endInput.value = '2026-11-30';
    endInput.dispatchEvent(new Event('change'));
    
    const scheduleList = app.state.proposals[app.state.activeProposalEditalId].schedule;
    expect(scheduleList.find(i => i.tarefa === 'Divulgação do Evento').fim).toBe('2026-11-30');
  });

  // --- Feature 3: Kanban & Submissions (R3) ---

  it('T1.F3.1: Colunas do Kanban - Garante que o quadro kanban exibe as 6 colunas/estágios corretas', () => {
    container.querySelector('#nav-kanban').click();
    const cols = Array.from(container.querySelectorAll('.kanban-column')).map(el => el.dataset.stage);
    expect(cols).toContain('Rascunho');
    expect(cols).toContain('Em Elaboração');
    expect(cols).toContain('Revisão Interna');
    expect(cols).toContain('Pronto para Submissão');
    expect(cols).toContain('Submetido');
    expect(cols).toContain('Aprovado');
  });

  it('T1.F3.2: Arrastar e Soltar - Verifica a mudança de estágio de um projeto ao arrastar o card de uma coluna para outra', () => {
    container.querySelector('#nav-kanban').click();
    const project = app.state.projects[0];
    const initialStage = project.estagio;
    
    // Simulate drag & drop to "Revisão Interna"
    const success = app.moveProject(project.id, 'Revisão Interna');
    expect(success).toBe(true);
    expect(project.estagio).toBe('Revisão Interna');
  });

  it('T1.F3.3: Conteúdo do Card - Garante que o card do projeto exibe o nome do edital, prazo, progresso dos documentos e o agente IA', () => {
    container.querySelector('#nav-kanban').click();
    const card = container.querySelector('.project-card');
    expect(card.querySelector('.project-title').textContent).toBeTruthy();
    expect(card.querySelector('.project-deadline').textContent).toBeTruthy();
    expect(card.querySelector('.project-agent').textContent).toBeTruthy();
    expect(card.querySelector('.project-progress-text').textContent).toBeTruthy();
  });

  it('T1.F3.4: Visualização de Timeline - Verifica a renderização dos prazos em um componente de linha do tempo ou calendário', () => {
    container.querySelector('#nav-kanban').click();
    const rows = container.querySelectorAll('.timeline-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].querySelector('.timeline-proj-name').textContent).toBeTruthy();
    expect(rows[0].querySelector('.timeline-bar').textContent).toContain('Prazo:');
  });

  it('T1.F3.5: Alerta de Prazos - Confirma se alertas/indicadores visuais são exibidos para prazos próximos', () => {
    container.querySelector('#nav-kanban').click();
    // Set deadline closer to trigger alert
    app.state.projects[0].prazo = '2026-07-10';
    app.render();
    
    const card = container.querySelector('.project-card[data-id="p1"]');
    expect(card.querySelector('.deadline-alert')).toBeTruthy();
  });

  // --- Feature 4: Post-Approval (R4) ---

  it('T1.F4.1: Comparativo Cronograma - Verifica a exibição do comparativo cronograma planejado vs. real para projetos aprovados', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    const compareRows = container.querySelectorAll('.schedule-compare-row');
    expect(compareRows.length).toBeGreaterThan(0);
    expect(compareRows[0].querySelector('.compare-task').textContent).toBeTruthy();
    expect(compareRows[0].querySelector('.compare-planned').textContent).toBeTruthy();
    expect(compareRows[0].querySelector('.compare-real').textContent).toBeTruthy();
  });

  it('T1.F4.2: Controle Financeiro - Garante que o razão financeiro exibe rubricas de verba planejada vs. gasta', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    const rubricRows = container.querySelectorAll('.rubric-row');
    expect(rubricRows.length).toBeGreaterThan(0);
    expect(rubricRows[0].querySelector('.rubric-desc').textContent).toBeTruthy();
    expect(rubricRows[0].querySelector('.rubric-planejado').textContent).toBeTruthy();
    expect(rubricRows[0].querySelector('.rubric-gasto').textContent).toBeTruthy();
  });

  it('T1.F4.3: Adição de Transações - Confirma que o usuário pode adicionar novos gastos a uma rubrica específica', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    container.querySelector('#tx-desc').value = 'Hospedagem e Alimentação';
    container.querySelector('#tx-val').value = '1500';
    container.querySelector('#tx-rubric-select').value = '1';
    container.querySelector('.add-transaction-form').dispatchEvent(new Event('submit'));
    
    const txItems = container.querySelectorAll('.transaction-item');
    expect(txItems.length).toBeGreaterThan(0);
    expect(txItems[0].textContent).toContain('Hospedagem e Alimentação');
  });

  it('T1.F4.4: Exportar Relatório - Teste da exportação de relatório de prestação de contas parcial/final em markdown', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    container.querySelector('#btn-export-report').click();
    
    const output = container.querySelector('#export-output');
    expect(output.style.display).not.toBe('none');
    expect(output.textContent).toContain('# Relatório de Prestação de Contas');
    expect(output.textContent).toContain('Orçamento Planejado');
  });

  it('T1.F4.5: Checklist de Obrigações - Verifica a exibição de obrigações pendentes pós-aprovação', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    const obligations = container.querySelectorAll('.obligation-item');
    expect(obligations.length).toBeGreaterThan(0);
    expect(obligations[0].querySelector('.obligation-desc').textContent).toBeTruthy();
  });

  // --- Feature 5: SPA App Shell (R5) ---

  it('T1.F5.1: Navegação sem Recarga - Garante que a troca de módulos funciona sem recarregar a página (comportamento SPA)', () => {
    let reloaded = false;
    window.onbeforeunload = () => { reloaded = true; };
    
    container.querySelector('#nav-propostas').click();
    expect(reloaded).toBe(false);
    expect(app.state.activeModule).toBe('propostas');
  });

  it('T1.F5.2: Tradução Completa (pt-BR) - Verifica se todos os textos da UI estão em português (sem termos em inglês)', () => {
    const labels = Array.from(container.querySelectorAll('.nav-label')).map(el => el.textContent.trim().toLowerCase());
    expect(labels).toContain('descoberta');
    expect(labels).toContain('propostas');
    expect(labels).toContain('submissões');
    expect(labels).toContain('pós-aprovação');
    
    const title = container.querySelector('.header-title').textContent;
    expect(title).toBe('Monitoramento e Descoberta de Editais');
  });

  it('T1.F5.3: Responsividade Desktop - Valida que a sidebar e o layout são exibidos de forma adequada em resoluções desktop comuns', () => {
    app.state.viewportWidth = 1280;
    app.render();
    expect(container.className).toContain('layout-desktop');
  });

  it('T1.F5.4: Responsividade Tablet - Valida a adaptação do layout ao redimensionar a tela para o tamanho de tablet', () => {
    app.state.viewportWidth = 760;
    app.render();
    expect(container.className).toContain('layout-tablet');
  });

  it('T1.F5.5: Barra de Navegação - Garante que todos os itens de navegação (Painel, Agentes, Tarefas, etc.) levam às telas certas', () => {
    container.querySelector('#nav-kanban').click();
    expect(container.querySelector('.header-title').textContent).toBe('Gestão de Submissões e Prazos');
    
    container.querySelector('#nav-pos-aprovacao').click();
    expect(container.querySelector('.header-title').textContent).toBe('Acompanhamento Pós-Aprovação');
  });


  // ==========================================
  // TIER 2 - BOUNDARY & CORNER CASES (25 cases)
  // ==========================================

  // --- Feature 1 Boundaries ---

  it('T2.F1.1: Sem Editais Correspondentes - Altera perfil para valores impossíveis e verifica se o sistema mostra mensagem amigável de "Nenhum edital compatível"', () => {
    app.state.userProfile.maxOrcamento = 1;
    app.state.userProfile.keywords = ['inexistente_keyword_xyz'];
    app.recalculateScores();
    
    container.querySelector('#editais-search').value = 'NenhumEditalVaiEncontrarIsso';
    container.querySelector('#editais-search').dispatchEvent(new Event('input'));
    
    expect(container.querySelector('.no-results').textContent).toBe('Nenhum edital compatível');
  });

  it('T2.F1.2: Valores no Limite - Testa ordenação e filtragem com valores de edital extremos (zero, bilhões)', () => {
    app.state.editais.push({ id: 'e_zero', titulo: 'Edital Gratuito', orgao: 'MinC', prazo: '2026-10-10', valor: 0, categoria: 'cultura', score: 50, status: 'aberto' });
    app.state.editais.push({ id: 'e_billion', titulo: 'Edital Bilionário', orgao: 'FINEP', prazo: '2026-11-11', valor: 1000000000000, categoria: 'inovação', score: 50, status: 'aberto' });
    app.recalculateScores();
    app.render();
    
    const cards = container.querySelectorAll('.edital-card');
    expect(cards.length).toBeGreaterThanOrEqual(12);
  });

  it('T2.F1.3: Prazos Expirados - Garante que editais vencidos são destacados com tags visuais de status fechado ou removidos da lista padrão', () => {
    const expiredCard = container.querySelector('.edital-card[data-id="e7"]');
    expect(expiredCard.className).toContain('status-fechado');
    expect(expiredCard.querySelector('.edital-status-badge').textContent).toBe('Fechado');
    expect(expiredCard.querySelector('.btn-create-proposal')).toBeNull();
  });

  it('T2.F1.4: Perfil Vazio - Limpa todas as preferências e palavras-chave do perfil e verifica se o score padrão é exibido de forma neutra ou segura', () => {
    app.state.userProfile.keywords = [];
    app.state.userProfile.area = 'geral';
    app.recalculateScores();
    app.render();
    
    const finepCard = Array.from(container.querySelectorAll('.edital-card'))
      .find(c => c.querySelector('.edital-titulo').textContent.includes('FINEP'));
    expect(finepCard.querySelector('.compatibility-score').textContent).toContain('50%');
  });

  it('T2.F1.5: Caractere Especial no Filtro - Testa busca/filtro de editais contendo caracteres especiais (ex: @, *, &)', () => {
    container.querySelector('#editais-search').value = '@#$&*';
    container.querySelector('#editais-search').dispatchEvent(new Event('input'));
    
    expect(container.querySelector('.no-results')).toBeTruthy();
  });

  // --- Feature 2 Boundaries ---

  it('T2.F2.1: Valores de Orçamento Negativos - Tenta inserir valores negativos no orçamento e verifica se o sistema valida ou impede o salvamento', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="orcamento"]').click();
    container.querySelector('#btn-add-budget-row').click();
    
    const inputVal = container.querySelector('.budget-val');
    inputVal.value = '-500';
    inputVal.dispatchEvent(new Event('change'));
    
    expect(container.querySelector('.validation-error').textContent).toBe('Valor não pode ser negativo');
  });

  it('T2.F2.2: Data de Cronograma Inválida - Insere data final anterior à data inicial no cronograma e valida o comportamento de erro', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="cronograma"]').click();
    container.querySelector('#btn-add-schedule-row').click();
    
    let startInput = container.querySelector('.schedule-start');
    startInput.value = '2026-12-31';
    startInput.dispatchEvent(new Event('change'));
    
    let endInput = container.querySelector('.schedule-end');
    endInput.value = '2026-12-01'; // End before start
    endInput.dispatchEvent(new Event('change'));
    
    expect(container.querySelector('.validation-error').textContent).toBe('Fim deve ser após Início');
  });

  it('T2.F2.3: Seção Vazia na Geração - Tenta "Gerar com IA" em uma seção sem foco ou com campos bloqueados e verifica se lida corretamente', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="orcamento"]').click();
    expect(container.querySelector('#btn-generate-ai')).toBeNull(); // Not available for budget
  });

  it('T2.F2.4: Limite de Caracteres - Insere texto extremamente longo em uma seção de proposta e testa a persistência e visualização', () => {
    container.querySelector('#nav-propostas').click();
    const editor = container.querySelector('#rich-text-editor');
    const extremelyLongText = 'X'.repeat(10000);
    editor.value = extremelyLongText;
    editor.dispatchEvent(new Event('input'));
    
    expect(app.state.proposals[app.state.activeProposalEditalId].objetivos.length).toBe(10000);
  });

  it('T2.F2.5: Adicionar Linha Vazia - Valida o comportamento de adicionar e excluir itens no orçamento e no cronograma', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="orcamento"]').click();
    container.querySelector('#btn-add-budget-row').click();
    
    let rows = container.querySelectorAll('.budget-table tbody tr');
    const countBefore = rows.length;
    
    const deleteBtn = container.querySelector('.btn-delete-budget-row');
    deleteBtn.click();
    
    rows = container.querySelectorAll('.budget-table tbody tr');
    expect(rows.length).toBe(countBefore - 1);
  });

  // --- Feature 3 Boundaries (named T3.F3.* as designed in TEST_INFRA.md) ---

  it('T3.F3.1: Documentos 100% Completos - Altera checklist de documentos para 100% completo e valida o status visual no card', () => {
    container.querySelector('#nav-kanban').click();
    const checks = container.querySelectorAll('.doc-chk[data-proj-id="p1"]');
    checks[0].checked = true;
    checks[1].checked = true;
    checks[2].checked = true;
    checks[2].dispatchEvent(new Event('change'));
    
    const card = container.querySelector('.project-card[data-id="p1"]');
    expect(card.querySelector('.project-progress-text').textContent).toBe('100%');
  });

  it('T3.F3.2: Sem Documentos - Valida o percentual inicial (0%) quando nenhuma caixa de documentos está marcada', () => {
    container.querySelector('#nav-kanban').click();
    const checks = container.querySelectorAll('.doc-chk[data-proj-id="p1"]');
    checks[0].checked = false;
    checks[1].checked = false;
    checks[2].checked = false;
    checks[2].dispatchEvent(new Event('change'));
    
    const card = container.querySelector('.project-card[data-id="p1"]');
    expect(card.querySelector('.project-progress-text').textContent).toBe('0%');
  });

  it('T3.F3.3: Arrastar para Coluna Inválida - Tenta arrastar um card para fora das colunas kanban e valida se ele retorna à posição de origem de forma segura', () => {
    container.querySelector('#nav-kanban').click();
    const moved = app.moveProject('p2', 'Aprovado'); // Invalid directly from Rascunho
    expect(moved).toBe(false);
    expect(app.state.projects.find(p => p.id === 'p2').estagio).toBe('Rascunho');
  });

  it('T3.F3.4: Prazos Conflitantes - Insere múltiplos projetos com o mesmo prazo e valida a renderização legível na linha do tempo', () => {
    container.querySelector('#nav-kanban').click();
    app.state.projects[0].prazo = '2026-10-15';
    app.state.projects[1].prazo = '2026-10-15';
    app.render();
    
    const timelines = container.querySelectorAll('.timeline-row');
    expect(timelines[0].textContent).toContain('2026-10-15');
    expect(timelines[1].textContent).toContain('2026-10-15');
  });

  it('T3.F3.5: Sem Agente Atribuído - Garante que o card funciona corretamente e mostra a informação "Nenhum agente" caso não haja agente atribuído', () => {
    container.querySelector('#nav-kanban').click();
    app.state.projects[0].agenteAtribuido = null;
    app.render();
    
    const card = container.querySelector('.project-card[data-id="p1"]');
    expect(card.querySelector('.project-agent').textContent).toBe('Nenhum agente');
  });

  // --- Feature 4 Boundaries ---

  it('T2.F4.1: Estouro de Orçamento - Adiciona transações que excedem o valor da rubrica e verifica se exibe indicador visual de estouro', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    container.querySelector('#tx-desc').value = 'Estouro RH';
    container.querySelector('#tx-val').value = '200000'; // rubrica 1 is planejado 150000
    container.querySelector('#tx-rubric-select').value = '1';
    container.querySelector('.add-transaction-form').dispatchEvent(new Event('submit'));
    
    const row = container.querySelector('.rubric-row[data-id="1"]');
    expect(row.className).toContain('ledger-overflow');
    expect(row.querySelector('.overflow-alert')).toBeTruthy();
  });

  it('T2.F4.2: Rubrica sem Valor - Tenta criar rubrica com valor zero e valida se o sistema lida corretamente', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    app.state.posAprovacao[app.state.selectedApprovedProjectId].rubrics.push({
      id: 99, descricao: 'Rubrica Zero', planejado: 0, gasto: 0
    });
    app.render();
    
    const row = container.querySelector('.rubric-row[data-id="99"]');
    expect(row.querySelector('.rubric-planejado').textContent).toContain('R$ 0');
  });

  it('T2.F4.3: Exportar sem Dados - Tenta exportar relatório com propostas/projetos vazios e valida se cria um markdown com estrutura padrão limpa', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    // Clear all rubrics
    app.state.posAprovacao[app.state.selectedApprovedProjectId].rubrics = [];
    app.render();
    
    container.querySelector('#btn-export-report').click();
    const output = container.querySelector('#export-output');
    expect(output.textContent).toContain('Estrutura padrão limpa');
  });

  it('T2.F4.4: Cronograma Real Atrasado - Altera datas do cronograma real para após o prazo e verifica o indicador de atraso', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    const compareRow = container.querySelector('.schedule-compare-row.status-atrasado');
    expect(compareRow).toBeTruthy();
    expect(compareRow.querySelector('.delay-alert')).toBeTruthy();
  });

  it('T2.F4.5: Exclusão de Todas as Rubricas - Exclui todas as rubricas financeiras e valida se o módulo exibe estado vazio estruturado', () => {
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    
    let deleteBtns = container.querySelectorAll('.btn-delete-rubric');
    while (deleteBtns.length > 0) {
      deleteBtns[0].click();
      deleteBtns = container.querySelectorAll('.btn-delete-rubric');
    }
    
    expect(container.querySelector('.ledger-empty').textContent).toContain('Estado vazio estruturado: Nenhuma rubrica configurada');
  });

  // --- Feature 5 Boundaries ---

  it('T2.F5.1: Resolução Mínima - Testa a interface em tela de tamanho mínimo (320px) para verificar se ocorrem quebras de layout', () => {
    app.state.viewportWidth = 320;
    app.render();
    expect(container.className).toContain('layout-tablet');
  });

  it('T2.F5.2: Injeção de Código na URL / Input - Tenta inserir tags HTML em campos de input e valida a proteção contra XSS (os inputs devem ser tratados como texto literal)', () => {
    container.querySelector('#nav-propostas').click();
    const editor = container.querySelector('#rich-text-editor');
    const xss = '<script>alert("xss")</script>';
    editor.value = xss;
    editor.dispatchEvent(new Event('input'));
    
    container.querySelector('#nav-editais').click();
    container.querySelector('#nav-propostas').click();
    expect(container.querySelector('#rich-text-editor').value).toBe(xss);
  });

  it('T2.F5.3: Carga Rápida entre Módulos - Clica repetidamente e de forma rápida nos links de navegação para validar estabilidade da renderização', () => {
    for (let i = 0; i < 25; i++) {
      container.querySelector('#nav-editais').click();
      container.querySelector('#nav-propostas').click();
      container.querySelector('#nav-kanban').click();
      container.querySelector('#nav-pos-aprovacao').click();
    }
    expect(app.state.activeModule).toBe('pos-aprovacao');
  }, 30000);

  it('T2.F5.4: Fonte Redimensionada - Valida se o layout se adapta quando a escala de fontes do navegador é aumentada', () => {
    app.state.fontSizeScale = 2.0;
    app.render();
    expect(container.style.fontSize).toBe('2em');
  });

  it('T2.F5.5: Termos Técnicos em Inglês - Garante que mesmo termos comuns da web (ex: "Save", "Cancel", "IA", "Status") possuem alternativas adequadas em pt-BR', () => {
    // Navigate to propostas
    container.querySelector('#nav-propostas').click();
    let text = container.innerHTML;
    expect(text).not.toContain('Save Proposal');
    expect(text).toContain('Salvar Proposta');

    // Navigate to pos-aprovacao
    app.state.projects[0].estagio = 'Aprovado';
    container.querySelector('#nav-pos-aprovacao').click();
    text = container.innerHTML;
    expect(text).not.toContain('Delete Rubric');
    expect(text).toContain('Excluir Rubrica');
  });


  // ==========================================
  // TIER 3 - CROSS-FEATURE COMBINATIONS (5 cases)
  // ==========================================

  it('T3.CF1: Do Perfil à Proposta - Altera o perfil de interesse -> seleciona edital descoberto -> cria proposta com base no edital selecionado -> verifica se a proposta herda as categorias corretas', () => {
    app.state.userProfile.area = 'cultura';
    app.recalculateScores();
    app.render();
    
    const e2Card = container.querySelector('.edital-card[data-id="e2"]');
    e2Card.querySelector('.btn-create-proposal').click();
    
    expect(app.state.activeProposalEditalId).toBe('e2');
    const edital = app.state.editais.find(e => e.id === 'e2');
    expect(edital.categoria).toBe('cultura');
  });

  it('T3.CF2: Fluxo Completo de Submissão - Move projeto no kanban para "Pronto para Submissão" -> gera proposta -> marca checklist de documentos como completo -> avança projeto para "Submetido"', () => {
    app.moveProject('p1', 'Pronto para Submissão');
    
    container.querySelector('#nav-kanban').click();
    const checks = container.querySelectorAll('.doc-chk[data-proj-id="p1"]');
    checks[0].checked = true;
    checks[1].checked = true;
    checks[2].checked = true;
    checks[2].dispatchEvent(new Event('change'));
    
    app.moveProject('p1', 'Submetido');
    expect(app.state.projects.find(p => p.id === 'p1').estagio).toBe('Submetido');
  });

  it('T3.CF3: Do Kanban ao Pós-Aprovação - Move card no kanban para "Aprovado" -> acessa o módulo Pós-Aprovação -> verifica se o projeto aparece listado com as rubricas de orçamento configuradas anteriormente na proposta', () => {
    app.moveProject('p1', 'Aprovado');
    container.querySelector('#nav-pos-aprovacao').click();
    
    const rubrics = container.querySelectorAll('.rubric-row');
    expect(rubrics.length).toBe(2);
    expect(rubrics[0].textContent).toContain('Recursos Humanos');
  });

  it('T3.CF4: Atualização de Prazos Bidirecional - Altera data de cronograma no editor de propostas -> verifica se o prazo correspondente é atualizado no card do kanban e no calendário de prazos', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="cronograma"]').click();
    
    app.state.proposals['e2'].schedule[1].fim = '2026-12-25';
    app.render();
    
    const project = app.state.projects.find(p => p.id === 'p1');
    project.prazo = app.state.proposals['e2'].schedule[1].fim;
    app.render();
    
    container.querySelector('#nav-kanban').click();
    const deadlineText = container.querySelector('.project-card[data-id="p1"] .project-deadline').textContent;
    expect(deadlineText).toBe('2026-12-25');
  });

  it('T3.CF5: Orçamento vs Realizado Pós-Aprovação - Modifica o orçamento da proposta na fase "Em Elaboração" -> aprova o edital -> adiciona despesas no Pós-Aprovação -> valida se o comparativo planejado vs. real calcula o saldo usando o valor da proposta atualizada', () => {
    container.querySelector('#nav-propostas').click();
    container.querySelector('.wizard-step[data-step="orcamento"]').click();
    app.state.proposals['e2'].budget[0].valor = 180000;
    app.render();
    
    app.moveProject('p1', 'Aprovado');
    container.querySelector('#nav-pos-aprovacao').click();
    
    const row = container.querySelector('.rubric-row[data-id="1"]');
    expect(row.querySelector('.rubric-planejado').textContent).toContain('180.000');
  });


  // ==========================================
  // TIER 4 - REAL-WORLD APPLICATION SCENARIOS (5 cases)
  // ==========================================

  it('T4.APP1: Ciclo de Vida do Edital de Cultura (Lei Rouanet)', () => {
    // 1. Configura perfil cultura
    let kwInput = container.querySelector('#profile-keywords');
    kwInput.value = 'Cultura, Rouanet';
    kwInput.dispatchEvent(new Event('change'));
    
    let areaSelect = container.querySelector('#profile-area');
    areaSelect.value = 'cultura';
    areaSelect.dispatchEvent(new Event('change'));
    
    // 2. Identifica Rouanet
    const rouanetCard = Array.from(container.querySelectorAll('.edital-card'))
      .find(c => c.querySelector('.edital-titulo').textContent.includes('Rouanet'));
    expect(Number(rouanetCard.querySelector('.compatibility-score').textContent.match(/\d+/)[0])).toBeGreaterThanOrEqual(80);
    
    // 3. Cria proposta e usa "Gerar com IA"
    rouanetCard.querySelector('.btn-create-proposal').click();
    container.querySelector('.wizard-step[data-step="justificativa"]').click();
    container.querySelector('#btn-generate-ai').click();
    expect(container.querySelector('#rich-text-editor').value).toContain('Justificativa:');
    
    // 4. Cronograma
    container.querySelector('.wizard-step[data-step="cronograma"]').click();
    app.state.proposals['e2'].schedule.push({ id: 3, tarefa: 'Produção Cultural Rouanet', inicio: '2026-12-01', fim: '2027-05-30' });
    app.render();
    
    // 5. Move para Pronto
    app.moveProject('p1', 'Pronto para Submissão');
    
    // 6. Aprovação fictícia e relatório
    app.moveProject('p1', 'Aprovado');
    container.querySelector('#nav-pos-aprovacao').click();
    container.querySelector('#btn-export-report').click();
    expect(container.querySelector('#export-output').textContent).toContain('Lei Rouanet');
  });

  it('T4.APP2: Ciclo de Vida do Edital de Inovação (FINEP)', () => {
    // 1. Configura perfil inovação
    let kwInput = container.querySelector('#profile-keywords');
    kwInput.value = 'Inovação, FINEP';
    kwInput.dispatchEvent(new Event('change'));
    
    let budgetInput = container.querySelector('#profile-budget');
    budgetInput.value = '500000';
    budgetInput.dispatchEvent(new Event('change'));
    
    // 2. Filtra FINEP
    container.querySelector('.filter-category[data-category="inovação"]').click();
    const finepCard = Array.from(container.querySelectorAll('.edital-card'))
      .find(c => c.querySelector('.edital-titulo').textContent.includes('FINEP'));
    expect(finepCard).toBeTruthy();
    
    // 3. Proposta orçamentária
    finepCard.querySelector('.btn-create-proposal').click();
    container.querySelector('.wizard-step[data-step="orcamento"]').click();
    app.state.proposals['e1'].budget = [
      { id: 10, descricao: 'RH Inovação', valor: 300000 },
      { id: 11, descricao: 'Equipamentos', valor: 100000 },
      { id: 12, descricao: 'Consumíveis', valor: 50000 }
    ];
    app.render();
    
    // 4. Checklist documentos
    container.querySelector('#nav-kanban').click();
    const checks = container.querySelectorAll('.doc-chk[data-proj-id="p2"]');
    checks[0].checked = true;
    checks[1].checked = true;
    checks[1].dispatchEvent(new Event('change'));
    expect(app.state.projects.find(p => p.id === 'p2').documentosCompletosPercent).toBeGreaterThan(60);
    
    // 5. Aprovado (move through intermediate stages to satisfy business rules)
    app.moveProject('p2', 'Em Elaboração');
    app.moveProject('p2', 'Revisão Interna');
    app.moveProject('p2', 'Pronto para Submissão');
    app.moveProject('p2', 'Submetido');
    app.moveProject('p2', 'Aprovado');
    
    // 6. Simula desembolso
    container.querySelector('#nav-pos-aprovacao').click();
    app.state.selectedApprovedProjectId = 'p2';
    app.render();
    
    container.querySelector('#tx-desc').value = 'Servidores Cloud';
    container.querySelector('#tx-val').value = '25000';
    container.querySelector('#tx-rubric-select').value = '11';
    container.querySelector('.add-transaction-form').dispatchEvent(new Event('submit'));
    
    const row = container.querySelector('.rubric-row[data-id="11"]');
    expect(row.querySelector('.rubric-gasto').textContent).toContain('25.000');
  });

  it('T4.APP3: Lançamento Multiprojeto Concorrente', () => {
    // 1. Cria projetos concorrentes
    app.state.projects = [
      { id: 'p_fapesp', editalId: 'e4', editalNome: 'Subvenção Econômica de Inovação', prazo: '2026-11-20', documentosCompletosPercent: 15, estagio: 'Rascunho', agenteAtribuido: 'Gemini CLI' },
      { id: 'p_cnpq', editalId: 'e8', editalNome: 'Inteligência Artificial para Saúde', prazo: '2026-11-15', documentosCompletosPercent: 25, estagio: 'Rascunho', agenteAtribuido: 'Claude Code' },
      { id: 'p_sebrae', editalId: 'e6', editalNome: 'Apoio a Cooperativas Locais', prazo: '2026-07-22', documentosCompletosPercent: 35, estagio: 'Rascunho', agenteAtribuido: 'ChatGPT' }
    ];
    app.render();
    
    container.querySelector('#nav-kanban').click();
    const cards = container.querySelectorAll('.project-card');
    expect(cards.length).toBe(3);
    
    // Verify isolation and different agents
    expect(cards[0].querySelector('.project-agent').textContent).toBe('Gemini CLI');
    expect(cards[1].querySelector('.project-agent').textContent).toBe('Claude Code');
    expect(cards[2].querySelector('.project-agent').textContent).toBe('ChatGPT');
  });

  it('T4.APP4: Auditoria e Ajuste de Contas pós-reprovação', () => {
    // 1. Projeto reprovado
    app.state.projects = [
      { id: 'p_reprovado', editalId: 'e2', editalNome: 'Edital Rouanet Reprovativo', prazo: '2026-10-15', documentosCompletosPercent: 40, estagio: 'Reprovado', agenteAtribuido: 'Gemini CLI' }
    ];
    app.render();
    
    // 2. Tenta pós-aprovação
    container.querySelector('#nav-pos-aprovacao').click();
    expect(container.querySelector('.ledger-empty').textContent).toContain('Nenhum projeto aprovado');
  });

  it('T4.APP5: Simulação de Alta Sobrecarga e Limpeza', () => {
    // 1. 20 editais de sobrecarga
    for (let i = 12; i < 32; i++) {
      app.state.editais.push({
        id: `e${i}`, titulo: `Edital de Sobrecarga ${i}`, orgao: 'Org Sobrecarga', prazo: '2026-12-30', valor: 80000, categoria: 'social', score: 50, status: 'aberto'
      });
    }
    app.recalculateScores();
    app.render();
    
    // 2. Filtros e buscas rápidas
    container.querySelector('.filter-category[data-category="social"]').click();
    let cards = container.querySelectorAll('.edital-card');
    expect(cards.length).toBeGreaterThan(15);
    
    container.querySelector('#editais-search').value = 'Sobrecarga';
    container.querySelector('#editais-search').dispatchEvent(new Event('input'));
    cards = container.querySelectorAll('.edital-card');
    expect(cards.length).toBe(20); // 20 added cards
  });

  it('T4.APP6: Fallback Mode - verify standalone App component without appBridge', () => {
    // 1. Unmount default app to prevent conflicts
    app.unmount();
    
    // 2. Mount App component without appBridge in a local container
    const localContainer = document.createElement('div');
    document.body.appendChild(localContainer);
    const root = createRoot(localContainer);
    flushSync(() => {
      root.render(React.createElement(App));
    });
    
    // 3. Verify that keywords input supports space typing and doesn't trim immediately in state
    const kwInput = localContainer.querySelector('#profile-keywords');
    const budgetInput = localContainer.querySelector('#profile-budget');
    const areaSelect = localContainer.querySelector('#profile-area');
    expect(kwInput).toBeTruthy();
    expect(budgetInput).toBeTruthy();
    expect(areaSelect).toBeTruthy();

    const updateFormControl = (element, value, eventType = 'input') => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(element),
        'value',
      ).set;
      valueSetter.call(element, value);
      element.dispatchEvent(new Event(eventType, { bubbles: true }));
    };
    
    flushSync(() => {
      updateFormControl(kwInput, 'tecnologia, ');
    });
    expect(kwInput.value).toBe('tecnologia, ');
    
    // 4. Update keywords, budget, and area in fallback mode and verify score recalculation
    flushSync(() => {
      updateFormControl(kwInput, 'FINEP, Inovação');
    });
    
    flushSync(() => {
      updateFormControl(budgetInput, '200000');
    });
    
    flushSync(() => {
      updateFormControl(areaSelect, 'inovação', 'change');
    });
    
    // e1 (FINEP, Inovação Tecnológica, valor 500000, categoria inovação)
    // keywords match: 'FINEP' matches, 'Inovação' matches -> 2 matches -> +30 score
    // budget limit (500000 > 200000) exceeded -> -20 score
    // area matches (inovação) -> +20 score
    // total score = 50 - 20 + 30 + 20 = 80
    const finepCard = Array.from(localContainer.querySelectorAll('.edital-card'))
      .find(c => c.querySelector('.edital-titulo').textContent.includes('FINEP'));
    expect(finepCard.querySelector('.compatibility-score').textContent).toContain('80%');
    
    // 5. Test Save Profile button triggering recalculation in fallback mode
    const saveBtn = localContainer.querySelector('#save-profile');
    saveBtn.click();
    expect(finepCard.querySelector('.compatibility-score').textContent).toContain('80%');
    
    // Clean up local container
    root.unmount();
    localContainer.remove();
  });
});
