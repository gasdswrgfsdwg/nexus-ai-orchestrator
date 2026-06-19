import React from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { loadCloudWorkspace, saveCloudWorkspace } from '../lib/workspaceCloud';

const getErrorMessage = error => error?.message || 'Não foi possível sincronizar agora.';

export default function useWorkspaceSync({ workspace, applyWorkspace, disabled = false }) {
  const [user, setUser] = React.useState(null);
  const [status, setStatus] = React.useState(isSupabaseConfigured ? 'local' : 'unconfigured');
  const [message, setMessage] = React.useState('');
  const [lastSyncedAt, setLastSyncedAt] = React.useState('');
  const [cloudReady, setCloudReady] = React.useState(false);
  const latestWorkspaceRef = React.useRef(workspace);

  React.useEffect(() => {
    latestWorkspaceRef.current = workspace;
  }, [workspace]);

  React.useEffect(() => {
    if (disabled || !supabase) return undefined;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        const nextUser = data.session?.user || null;
        setUser(current => (current?.id === nextUser?.id ? current : nextUser));
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        const nextUser = session?.user || null;
        setUser(current => (current?.id === nextUser?.id ? current : nextUser));
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [disabled]);

  const saveNow = React.useCallback(async () => {
    if (!user) return null;
    setStatus('syncing');
    setMessage('');
    try {
      const result = await saveCloudWorkspace(user.id, latestWorkspaceRef.current);
      setLastSyncedAt(result.updated_at);
      setStatus('synced');
      return result;
    } catch (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      return null;
    }
  }, [user]);

  const loadNow = React.useCallback(async () => {
    if (!user) return null;
    setStatus('syncing');
    setMessage('');
    try {
      const result = await loadCloudWorkspace();
      if (result?.workspace) applyWorkspace(result.workspace);
      setLastSyncedAt(result?.updated_at || '');
      setStatus(result ? 'synced' : 'local');
      return result;
    } catch (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      return null;
    }
  }, [applyWorkspace, user]);

  React.useEffect(() => {
    if (disabled || !user) {
      setCloudReady(false);
      if (isSupabaseConfigured) setStatus('local');
      return undefined;
    }

    let cancelled = false;
    const initializeCloud = async () => {
      setStatus('syncing');
      try {
        const remote = await loadCloudWorkspace();
        if (cancelled) return;
        if (remote?.workspace) {
          applyWorkspace(remote.workspace);
          setLastSyncedAt(remote.updated_at || '');
        } else {
          const saved = await saveCloudWorkspace(user.id, latestWorkspaceRef.current);
          if (cancelled) return;
          setLastSyncedAt(saved.updated_at);
        }
        setCloudReady(true);
        setStatus('synced');
        setMessage('');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(getErrorMessage(error));
      }
    };

    initializeCloud();
    return () => {
      cancelled = true;
    };
  }, [applyWorkspace, disabled, user]);

  React.useEffect(() => {
    if (disabled || !user || !cloudReady) return undefined;
    setStatus('pending');
    const timer = window.setTimeout(saveNow, 1200);
    return () => window.clearTimeout(timer);
  }, [cloudReady, disabled, saveNow, user, workspace]);

  const signIn = async (email, password) => {
    if (!supabase) return { error: new Error('Supabase não configurado.') };
    setStatus('connecting');
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setStatus('error');
      setMessage(getErrorMessage(result.error));
    }
    return result;
  };

  const signUp = async (email, password) => {
    if (!supabase) return { error: new Error('Supabase não configurado.') };
    setStatus('connecting');
    const emailRedirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (result.error) {
      setStatus('error');
      setMessage(getErrorMessage(result.error));
    } else if (!result.data.session) {
      setStatus('local');
      setMessage('Confirme o e-mail para ativar a sincronização.');
    }
    return result;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setCloudReady(false);
    setStatus('local');
    setMessage('');
  };

  return {
    configured: isSupabaseConfigured,
    user,
    status,
    message,
    lastSyncedAt,
    signIn,
    signUp,
    signOut,
    saveNow,
    loadNow,
  };
}
