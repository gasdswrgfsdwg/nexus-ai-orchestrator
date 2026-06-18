import { describe, expect, it } from 'vitest';
import {
  buildAnuenciaMarkdown,
  buildProjectMarkdown,
  createBudgetItem,
  createGoal,
  createTeamMember,
  getBudgetTotal,
  getDossierCompletion,
  normalizeBudgetItem,
  normalizeGoal,
  normalizeProposal,
  normalizeTeamMember,
} from '../../src/data/projectModel';

describe('Project dossier model', () => {
  it('normalizes legacy budget rows without losing their total', () => {
    const item = normalizeBudgetItem({ id: 1, descricao: 'Produção', valor: 25000 });

    expect(item.quantidade).toBe(1);
    expect(item.valorUnitario).toBe(25000);
    expect(item.valor).toBe(25000);
    expect(item.status).toBe('estimado');
  });

  it('calculates totals from configurable quantity and unit value', () => {
    const item = {
      ...createBudgetItem(2),
      quantidade: 6,
      valorUnitario: 3200,
      valor: 19200,
      unidadeMedida: 'mes',
      frequencia: 'mensal',
    };

    expect(getBudgetTotal([item])).toBe(19200);
  });

  it('exports a portable project document with dossier and finance data', () => {
    const proposal = normalizeProposal({
      editalId: 'e1',
      tituloProjeto: 'Cultura em Rede',
      ideiaCentral: 'Conectar agentes culturais locais.',
      sinopse: 'Formação e circulação em rede.',
      proponente: 'Nexus Digital',
      responsavel: 'Equipe de Projetos',
      territorio: 'Espírito Santo',
      publicoAlvo: 'Agentes culturais',
      objetivos: 'Fortalecer a rede.',
      justificativa: 'Existe baixa articulação territorial.',
      metodologia: 'Oficinas, mentorias e mostra final.',
      budget: [{ id: 1, descricao: 'Coordenação', valor: 30000 }],
      schedule: [{ id: 1, tarefa: 'Mobilização', inicio: '2026-08-01', fim: '2026-08-31' }],
    }, 'e1');

    const markdown = buildProjectMarkdown({ proposal, edital: { titulo: 'Edital Cultura 2026' } });

    expect(getDossierCompletion(proposal)).toBeGreaterThan(80);
    expect(markdown).toContain('# Cultura em Rede');
    expect(markdown).toContain('## Ideia central');
    expect(markdown).toContain('## Plano financeiro');
    expect(markdown).toContain('Coordenação');
  });
});

describe('Project team and anuência', () => {
  it('creates a team member with safe defaults', () => {
    const member = createTeamMember(7);

    expect(member.id).toBe(7);
    expect(member.nome).toBe('');
    expect(member.funcao).toBe('coordenacao');
    expect(member.vinculo).toBe('contratado');
    expect(member.anuencia).toBe(false);
  });

  it('preserves unknown fields and coerces anuência when normalizing a member', () => {
    const member = normalizeTeamMember({ id: 3, nome: 'Ana', anuencia: 1, campoLegado: 'manter' });

    expect(member.nome).toBe('Ana');
    expect(member.anuencia).toBe(true);
    expect(member.campoLegado).toBe('manter');
    expect(member.funcao).toBe('coordenacao');
  });

  it('keeps a team array on the normalized proposal and in the markdown export', () => {
    const proposal = normalizeProposal({
      editalId: 'e1',
      tituloProjeto: 'Cultura em Rede',
      team: [{ id: 1, nome: 'Maria Souza', funcao: 'producao', vinculo: 'contratado', cpf: '123.456.789-00', anuencia: true }],
    }, 'e1');

    expect(proposal.team).toHaveLength(1);
    expect(proposal.team[0].nome).toBe('Maria Souza');

    const markdown = buildProjectMarkdown({ proposal, edital: { titulo: 'Edital Cultura 2026' } });
    expect(markdown).toContain('## Equipe');
    expect(markdown).toContain('Maria Souza');
    expect(markdown).toContain('Registrada');
  });

  it('builds a filled Termo de Anuência for a team member', () => {
    const proposal = normalizeProposal({
      editalId: 'e1',
      tituloProjeto: 'Cultura em Rede',
      proponente: 'Nexus Digital',
      territorio: 'Espírito Santo',
    }, 'e1');
    const member = normalizeTeamMember({ id: 1, nome: 'João Lima', funcao: 'oficineiro', cpf: '111.222.333-44', cidade: 'Marilândia', dataAnuencia: '2026-08-15' });

    const anuencia = buildAnuenciaMarkdown({ member, proposal, edital: { titulo: 'Edital Cultura 2026' } });

    expect(anuencia).toContain('# Termo de Anuência e Autorização de Participação');
    expect(anuencia).toContain('João Lima');
    expect(anuencia).toContain('111.222.333-44');
    expect(anuencia).toContain('Cultura em Rede');
    expect(anuencia).toContain('Oficineiro(a) / Educador(a)');
    expect(anuencia).toContain('Marilândia, 15/08/2026.');
  });
});

describe('Project goals (metas e indicadores)', () => {
  it('creates a goal with safe defaults', () => {
    const goal = createGoal(5);
    expect(goal.id).toBe(5);
    expect(goal.descricao).toBe('');
    expect(goal.quantidade).toBe(1);
  });

  it('preserves unknown fields and coerces quantity when normalizing a goal', () => {
    const goal = normalizeGoal({ id: 2, descricao: 'Realizar oficinas', quantidade: '8', campoLegado: 'manter' });
    expect(goal.descricao).toBe('Realizar oficinas');
    expect(goal.quantidade).toBe(8);
    expect(goal.campoLegado).toBe('manter');
  });

  it('keeps goals on the normalized proposal and in the markdown export', () => {
    const proposal = normalizeProposal({
      editalId: 'e1',
      tituloProjeto: 'Cultura em Rede',
      goals: [{ id: 1, descricao: 'Formar agentes culturais', indicador: 'Participantes certificados', quantidade: 40, unidade: 'pessoas', meioVerificacao: 'Lista de presença' }],
    }, 'e1');

    expect(proposal.goals).toHaveLength(1);

    const markdown = buildProjectMarkdown({ proposal, edital: { titulo: 'Edital Cultura 2026' } });
    expect(markdown).toContain('## Metas e indicadores');
    expect(markdown).toContain('Formar agentes culturais');
    expect(markdown).toContain('Lista de presença');
  });
});

describe('Project import / migração', () => {
  it('preserves unknown top-level and member fields when normalizing an imported project', () => {
    const imported = normalizeProposal({
      editalId: 'e9',
      tituloProjeto: 'Projeto Importado',
      campoFuturo: { nota: 'manter' },
      team: [{ id: 1, nome: 'X', papelCustomizado: 'manter' }],
      budget: [{ id: 1, descricao: 'Item', valor: 1000 }],
    }, 'e9');

    expect(imported.campoFuturo).toEqual({ nota: 'manter' });
    expect(imported.team[0].papelCustomizado).toBe('manter');
    expect(imported.budget[0].valor).toBe(1000);
    expect(imported.tituloProjeto).toBe('Projeto Importado');
  });
});
