import { isSupabaseConfigured, supabase } from './supabaseClient';

export const WORKSPACE_SCHEMA_VERSION = 1;
export const WORKSPACE_TABLE = 'user_workspaces';

export const createCloudWorkspaceRow = (userId, workspace, updatedAt = new Date().toISOString()) => ({
  user_id: userId,
  workspace,
  schema_version: WORKSPACE_SCHEMA_VERSION,
  updated_at: updatedAt,
});

const requireClient = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado.');
  }
  return supabase;
};

export const loadCloudWorkspace = async () => {
  const client = requireClient();
  const { data, error } = await client
    .from(WORKSPACE_TABLE)
    .select('workspace, schema_version, updated_at')
    .maybeSingle();

  if (error) throw error;
  return data;
};
export const saveCloudWorkspace = async (userId, workspace) => {
  const client = requireClient();
  const row = createCloudWorkspaceRow(userId, workspace);
  const { data, error } = await client
    .from(WORKSPACE_TABLE)
    .upsert(row, { onConflict: 'user_id' })
    .select('updated_at')
    .single();

  if (error) throw error;
  return data;
};
