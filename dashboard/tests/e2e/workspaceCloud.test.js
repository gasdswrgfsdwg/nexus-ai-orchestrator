import { describe, expect, it } from 'vitest';
import { createCloudWorkspaceRow, WORKSPACE_SCHEMA_VERSION } from '../../src/lib/workspaceCloud';

describe('Cloud workspace payload', () => {
  it('builds a portable row without adding credentials or private metadata', () => {
    const workspace = { activeTab: 'propostas', proposals: { e1: { tituloProjeto: 'Projeto' } } };
    const row = createCloudWorkspaceRow('user-123', workspace, '2026-06-19T12:00:00.000Z');

    expect(row).toEqual({
      user_id: 'user-123',
      workspace,
      schema_version: WORKSPACE_SCHEMA_VERSION,
      updated_at: '2026-06-19T12:00:00.000Z',
    });
    expect(JSON.stringify(row)).not.toContain('service_role');
  });
});
