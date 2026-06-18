import { describe, expect, it } from 'vitest';
import {
  buildProjectMarkdown,
  createBudgetItem,
  getBudgetTotal,
  getDossierCompletion,
  normalizeBudgetItem,
  normalizeProposal,
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
