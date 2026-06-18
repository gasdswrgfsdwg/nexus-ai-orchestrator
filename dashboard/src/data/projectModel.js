export const PROJECT_STATUS_OPTIONS = [
  { value: 'ideia', label: 'Ideia' },
  { value: 'em_escrita', label: 'Em escrita' },
  { value: 'em_revisao', label: 'Em revisão' },
  { value: 'pronto', label: 'Pronto para envio' },
  { value: 'submetido', label: 'Submetido' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'concluido', label: 'Concluído' },
];

export const PROJECT_AREA_OPTIONS = [
  { value: 'cultura', label: 'Cultura' },
  { value: 'inovacao', label: 'Inovação e tecnologia' },
  { value: 'educacao', label: 'Educação' },
  { value: 'social', label: 'Impacto social' },
  { value: 'saude', label: 'Saúde' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'meio_ambiente', label: 'Meio ambiente' },
  { value: 'economia_criativa', label: 'Economia criativa' },
  { value: 'outros', label: 'Outros' },
];

export const BUDGET_CATEGORY_OPTIONS = [
  { value: 'equipe', label: 'Equipe e pessoal' },
  { value: 'servicos', label: 'Serviços de terceiros' },
  { value: 'materiais', label: 'Materiais e insumos' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'logistica', label: 'Logística e transporte' },
  { value: 'comunicacao', label: 'Comunicação e divulgação' },
  { value: 'acessibilidade', label: 'Acessibilidade' },
  { value: 'impostos', label: 'Impostos e taxas' },
  { value: 'administrativo', label: 'Custos administrativos' },
  { value: 'outros', label: 'Outros' },
];

export const BUDGET_STATUS_OPTIONS = [
  { value: 'estimado', label: 'Estimado' },
  { value: 'cotado', label: 'Cotado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'contratado', label: 'Contratado' },
  { value: 'pago', label: 'Pago' },
];

export const UNIT_OPTIONS = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
  { value: 'servico', label: 'Serviço' },
  { value: 'diaria', label: 'Diária' },
  { value: 'hora', label: 'Hora' },
  { value: 'kit', label: 'Kit' },
  { value: 'lote', label: 'Lote' },
];

export const FREQUENCY_OPTIONS = [
  { value: 'unica', label: 'Parcela única' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export const FUNDING_SOURCE_OPTIONS = [
  { value: 'edital', label: 'Recurso do edital' },
  { value: 'contrapartida', label: 'Contrapartida' },
  { value: 'patrocinio', label: 'Patrocínio' },
  { value: 'proprio', label: 'Recurso próprio' },
  { value: 'outros', label: 'Outros' },
];

export const createBudgetItem = (id = Date.now()) => ({
  id,
  descricao: '',
  categoria: 'servicos',
  status: 'estimado',
  unidadeMedida: 'unidade',
  quantidade: 1,
  valorUnitario: 0,
  valor: 0,
  frequencia: 'unica',
  mesReferencia: '',
  anoReferencia: new Date().getFullYear(),
  fonteRecurso: 'edital',
});

export const normalizeBudgetItem = (item) => {
  const quantidade = Number(item.quantidade ?? 1);
  const valorUnitario = Number(item.valorUnitario ?? item.valor ?? 0);
  const calculatedValue = quantidade * valorUnitario;

  return {
    ...createBudgetItem(item.id),
    ...item,
    quantidade,
    valorUnitario,
    valor: Number(item.valor ?? calculatedValue),
  };
};

export const createEmptyProposal = (editalId = '') => ({
  editalId,
  tituloProjeto: '',
  ideiaCentral: '',
  sinopse: '',
  areaProjeto: 'cultura',
  statusProjeto: 'ideia',
  proponente: '',
  responsavel: '',
  territorio: '',
  publicoAlvo: '',
  duracaoMeses: 6,
  objetivos: '',
  justificativa: '',
  metodologia: '',
  budget: [],
  schedule: [],
});

export const normalizeProposal = (proposal, editalId = '') => ({
  ...createEmptyProposal(editalId),
  ...proposal,
  editalId: proposal?.editalId || editalId,
  budget: (proposal?.budget || []).map(normalizeBudgetItem),
  schedule: proposal?.schedule || [],
});

export const getBudgetTotal = (budget = []) => budget.reduce(
  (total, item) => total + Number(normalizeBudgetItem(item).valor || 0),
  0,
);

export const getBudgetSummary = (budget = []) => {
  const normalized = budget.map(normalizeBudgetItem);
  return normalized.reduce((summary, item) => {
    summary[item.categoria] = (summary[item.categoria] || 0) + Number(item.valor || 0);
    return summary;
  }, {});
};

export const getDossierCompletion = (proposal) => {
  const normalized = normalizeProposal(proposal, proposal?.editalId);
  const requiredFields = [
    normalized.tituloProjeto,
    normalized.ideiaCentral,
    normalized.sinopse,
    normalized.areaProjeto,
    normalized.statusProjeto,
    normalized.proponente,
    normalized.responsavel,
    normalized.territorio,
    normalized.publicoAlvo,
    normalized.objetivos,
    normalized.justificativa,
    normalized.metodologia,
  ];
  const completedFields = requiredFields.filter(value => String(value || '').trim()).length;
  const structuralPoints = Number(normalized.budget.length > 0) + Number(normalized.schedule.length > 0);
  return Math.round(((completedFields + structuralPoints) / (requiredFields.length + 2)) * 100);
};

const optionLabel = (options, value) => options.find(option => option.value === value)?.label || value || '-';
const escapeTableCell = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const buildProjectMarkdown = ({ proposal, edital }) => {
  const dossier = normalizeProposal(proposal, proposal?.editalId);
  const budget = dossier.budget.map(normalizeBudgetItem);
  const title = dossier.tituloProjeto || edital?.titulo || 'Projeto sem título';
  const budgetRows = budget.length > 0
    ? budget.map(item => `| ${escapeTableCell(item.descricao)} | ${optionLabel(BUDGET_CATEGORY_OPTIONS, item.categoria)} | ${optionLabel(UNIT_OPTIONS, item.unidadeMedida)} | ${item.quantidade} | ${money(item.valorUnitario)} | ${optionLabel(FREQUENCY_OPTIONS, item.frequencia)} | ${money(item.valor)} | ${optionLabel(BUDGET_STATUS_OPTIONS, item.status)} |`).join('\n')
    : '| Nenhum item cadastrado | - | - | - | - | - | - | - |';
  const scheduleRows = dossier.schedule.length > 0
    ? dossier.schedule.map(item => `| ${escapeTableCell(item.tarefa)} | ${item.inicio || '-'} | ${item.fim || '-'} |`).join('\n')
    : '| Nenhuma atividade cadastrada | - | - |';

  return `# ${title}

## Identificação

- **Edital:** ${edital?.titulo || '-'}
- **Área:** ${optionLabel(PROJECT_AREA_OPTIONS, dossier.areaProjeto)}
- **Status:** ${optionLabel(PROJECT_STATUS_OPTIONS, dossier.statusProjeto)}
- **Proponente:** ${dossier.proponente || '-'}
- **Responsável:** ${dossier.responsavel || '-'}
- **Território:** ${dossier.territorio || '-'}
- **Público-alvo:** ${dossier.publicoAlvo || '-'}
- **Duração:** ${dossier.duracaoMeses || '-'} meses

## Ideia central

${dossier.ideiaCentral || 'Não preenchida.'}

## Sinopse

${dossier.sinopse || 'Não preenchida.'}

## Objetivos

${dossier.objetivos || 'Não preenchidos.'}

## Justificativa

${dossier.justificativa || 'Não preenchida.'}

## Metodologia

${dossier.metodologia || 'Não preenchida.'}

## Cronograma

| Atividade | Início | Fim |
| --- | --- | --- |
${scheduleRows}

## Plano financeiro

| Item | Categoria | Unidade | Quantidade | Valor unitário | Frequência | Total | Status |
| --- | --- | --- | ---: | ---: | --- | ---: | --- |
${budgetRows}

**Total do projeto:** ${money(getBudgetTotal(budget))}
`;
};
