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

export const TEAM_ROLE_OPTIONS = [
  { value: 'coordenacao', label: 'Coordenação geral' },
  { value: 'producao', label: 'Produção' },
  { value: 'artistico', label: 'Direção artística / Artista' },
  { value: 'oficineiro', label: 'Oficineiro(a) / Educador(a)' },
  { value: 'tecnico', label: 'Equipe técnica' },
  { value: 'audiovisual', label: 'Audiovisual' },
  { value: 'comunicacao', label: 'Comunicação e divulgação' },
  { value: 'administrativo', label: 'Administrativo / Financeiro' },
  { value: 'acessibilidade', label: 'Acessibilidade' },
  { value: 'consultoria', label: 'Consultoria / Mentoria' },
  { value: 'apoio', label: 'Apoio / Logística' },
  { value: 'outros', label: 'Outros' },
];

export const TEAM_LINK_OPTIONS = [
  { value: 'proponente', label: 'Proponente' },
  { value: 'contratado', label: 'Contratado(a)' },
  { value: 'prestador', label: 'Prestador(a) de serviço' },
  { value: 'colaborador', label: 'Colaborador(a)' },
  { value: 'voluntario', label: 'Voluntário(a)' },
  { value: 'parceiro', label: 'Parceiro(a) institucional' },
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

export const createTeamMember = (id = Date.now()) => ({
  id,
  nome: '',
  funcao: 'coordenacao',
  vinculo: 'contratado',
  cpf: '',
  rg: '',
  cidade: '',
  email: '',
  telefone: '',
  anuencia: false,
  dataAnuencia: '',
});

export const normalizeTeamMember = (member = {}) => ({
  ...createTeamMember(member.id ?? Date.now()),
  ...member,
  anuencia: Boolean(member.anuencia),
});

export const createGoal = (id = Date.now()) => ({
  id,
  descricao: '',
  indicador: '',
  quantidade: 1,
  unidade: '',
  meioVerificacao: '',
});

export const normalizeGoal = (goal = {}) => ({
  ...createGoal(goal.id ?? Date.now()),
  ...goal,
  quantidade: Number(goal.quantidade ?? 1),
});

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
  team: [],
  goals: [],
  budget: [],
  schedule: [],
});

export const normalizeProposal = (proposal, editalId = '') => ({
  ...createEmptyProposal(editalId),
  ...proposal,
  editalId: proposal?.editalId || editalId,
  team: (proposal?.team || []).map(normalizeTeamMember),
  goals: (proposal?.goals || []).map(normalizeGoal),
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
  const team = dossier.team.map(normalizeTeamMember);
  const goals = dossier.goals.map(normalizeGoal);
  const title = dossier.tituloProjeto || edital?.titulo || 'Projeto sem título';
  const teamRows = team.length > 0
    ? team.map(member => `| ${escapeTableCell(member.nome) || '-'} | ${optionLabel(TEAM_ROLE_OPTIONS, member.funcao)} | ${optionLabel(TEAM_LINK_OPTIONS, member.vinculo)} | ${escapeTableCell(member.cpf) || '-'} | ${member.anuencia ? 'Registrada' : 'Pendente'} |`).join('\n')
    : '| Nenhum integrante cadastrado | - | - | - | - |';
  const goalRows = goals.length > 0
    ? goals.map(goal => `| ${escapeTableCell(goal.descricao) || '-'} | ${escapeTableCell(goal.indicador) || '-'} | ${goal.quantidade} | ${escapeTableCell(goal.unidade) || '-'} | ${escapeTableCell(goal.meioVerificacao) || '-'} |`).join('\n')
    : '| Nenhuma meta cadastrada | - | - | - | - |';
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

## Metas e indicadores

| Meta | Indicador | Quantidade | Unidade | Meio de verificação |
| --- | --- | ---: | --- | --- |
${goalRows}

## Equipe

| Integrante | Função | Vínculo | CPF | Anuência |
| --- | --- | --- | --- | --- |
${teamRows}

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

const blankField = value => (String(value ?? '').trim() || '____________________');
const formatBrDate = (value) => {
  const raw = String(value ?? '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '_____ de __________________ de _______';
};

export const buildAnuenciaMarkdown = ({ member, proposal, edital }) => {
  const person = normalizeTeamMember(member);
  const dossier = normalizeProposal(proposal, proposal?.editalId);
  const projeto = dossier.tituloProjeto || edital?.titulo || 'Projeto sem título';
  const editalNome = edital?.titulo || dossier.editalId || '-';
  const proponente = dossier.proponente || '-';
  const funcao = optionLabel(TEAM_ROLE_OPTIONS, person.funcao);
  const vinculo = optionLabel(TEAM_LINK_OPTIONS, person.vinculo);
  const cidade = person.cidade || dossier.territorio || 'Cidade';
  const contato = [person.email, person.telefone].filter(Boolean).join(' · ') || 'Não informado';

  return `# Termo de Anuência e Autorização de Participação

- **Projeto:** ${projeto}
- **Edital / Programa:** ${editalNome}
- **Proponente:** ${proponente}

Eu, **${blankField(person.nome)}**, portador(a) do CPF nº ${blankField(person.cpf)} e do documento de identidade (RG) nº ${blankField(person.rg)}, residente em ${blankField(person.cidade || dossier.territorio)}, declaro para os devidos fins que tenho pleno conhecimento do projeto **${projeto}** e **ANUO** com a minha participação na equipe, na função de **${funcao}**, na condição de **${vinculo}**.

Declaro estar ciente das atividades, do cronograma e das responsabilidades relativas à minha função, bem como autorizo o uso do meu nome e dos dados aqui informados para fins de inscrição, contratação, execução e prestação de contas do projeto, nos termos do edital e da legislação aplicável.

**Contato:** ${contato}

${cidade}, ${formatBrDate(person.dataAnuencia)}.


_____________________________________________
${blankField(person.nome)}
CPF: ${blankField(person.cpf)}
`;
};
