import { describe, expect, it } from 'vitest';
import {
  buildProjectAIRequest,
  getLocalProjectDraft,
} from '../../src/lib/projectAI';

describe('Project AI payload', () => {
  it('sends editorial context without personal or financial team data', () => {
    const payload = buildProjectAIRequest({
      section: 'justificativa',
      proposal: {
        tituloProjeto: 'Cultura em Rede',
        ideiaCentral: 'Conectar agentes culturais.',
        justificativa: 'Texto atual.',
        territorio: 'Colatina',
        publicoAlvo: 'Jovens',
        proponente: 'Pessoa que não deve ser enviada',
        responsavel: 'Responsável privado',
        team: [{
          nome: 'Nome privado',
          cpf: '000.000.000-00',
          rg: '000000',
          email: 'privado@example.com',
          telefone: '000000000',
          valorPrevisto: 10000,
        }],
        goals: [{ descricao: 'Realizar oficinas', indicador: 'Oficinas realizadas' }],
        schedule: [{ tarefa: 'Mobilização', inicio: '2026-08-01', fim: '2026-08-31' }],
      },
      edital: {
        titulo: 'Edital Cultura 2026',
        orgao: 'Secretaria de Cultura',
        valor: 100000,
      },
    });

    const serialized = JSON.stringify(payload);
    expect(payload.section).toBe('justificativa');
    expect(payload.project.metas[0].descricao).toBe('Realizar oficinas');
    expect(serialized).not.toContain('Nome privado');
    expect(serialized).not.toContain('000.000.000-00');
    expect(serialized).not.toContain('privado@example.com');
    expect(serialized).not.toContain('Responsável privado');
  });

  it('rejects sections outside the technical writing flow', () => {
    expect(() => buildProjectAIRequest({ section: 'orcamento' })).toThrow('Seção não permitida');
  });

  it('keeps a local draft available when the cloud is offline', () => {
    expect(getLocalProjectDraft('objetivos')).toContain('Texto gerado automaticamente por IA');
    expect(getLocalProjectDraft('orcamento')).toBe('');
  });
});
