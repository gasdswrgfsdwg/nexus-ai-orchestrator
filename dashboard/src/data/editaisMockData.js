import { normalizeProposal } from './projectModel';

export const initialUserProfile = {
  keywords: ['tecnologia', 'cultura', 'social'],
  area: 'geral',
  maxOrcamento: 1000000
};

export const initialEditais = [
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
];

export const initialProposals = {
  e2: normalizeProposal({
    editalId: 'e2',
    tituloProjeto: 'Circuito Cultura Digital Capixaba',
    ideiaCentral: 'Levar formação, criação e circulação cultural mediada por tecnologia para jovens de territórios periféricos.',
    sinopse: 'Circuito de oficinas e mostras que combina cultura regional, produção audiovisual e ferramentas digitais em uma jornada de seis meses.',
    areaProjeto: 'cultura',
    statusProjeto: 'em_escrita',
    proponente: 'Nexus Digital',
    responsavel: 'Coordenação de Projetos',
    territorio: 'Espírito Santo',
    publicoAlvo: 'Jovens de 15 a 29 anos, educadores e agentes culturais',
    duracaoMeses: 6,
    objetivos: 'Objetivos iniciais da proposta de cultura.',
    justificativa: 'Justificativa para captação Lei Rouanet.',
    metodologia: 'Metodologia de execução do plano cultural.',
    budget: [
      { id: 1, descricao: 'Equipe de coordenação e produção', categoria: 'equipe', unidadeMedida: 'mes', quantidade: 6, valorUnitario: 25000, valor: 150000, frequencia: 'mensal', status: 'estimado', fonteRecurso: 'edital', anoReferencia: 2026 },
      { id: 2, descricao: 'Logística e locações', categoria: 'logistica', unidadeMedida: 'servico', quantidade: 1, valorUnitario: 100000, valor: 100000, frequencia: 'unica', status: 'cotado', fonteRecurso: 'edital', anoReferencia: 2026 }
    ],
    schedule: [
      { id: 1, tarefa: 'Fase de Planejamento', inicio: '2026-11-01', fim: '2026-11-30' },
      { id: 2, tarefa: 'Produção e Execução', inicio: '2026-12-01', fim: '2027-04-30' }
    ]
  }, 'e2')
};

export const initialProjects = [
  { id: 'p1', editalId: 'e2', editalNome: 'Prêmio de Fomento à Cultura Lei Rouanet', prazo: '2026-10-15', documentosCompletosPercent: 50, estagio: 'Em Elaboração', agenteAtribuido: 'Gemini CLI' },
  { id: 'p2', editalId: 'e1', editalNome: 'Edital de Inovação Tecnológica FINEP', prazo: '2026-12-01', documentosCompletosPercent: 20, estagio: 'Rascunho', agenteAtribuido: 'Claude Code' }
];
