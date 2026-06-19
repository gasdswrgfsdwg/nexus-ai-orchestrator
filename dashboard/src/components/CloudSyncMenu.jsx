import React from 'react';
import { Cloud, CloudDownload, CloudOff, CloudUpload, LogIn, LogOut, RefreshCw } from 'lucide-react';

const STATUS_LABELS = {
  unconfigured: 'Dados locais',
  local: 'Entrar para sincronizar',
  connecting: 'Conectando',
  syncing: 'Sincronizando',
  pending: 'Alterações pendentes',
  synced: 'Sincronizado',
  error: 'Falha na sincronização',
};

const formatSyncTime = value => {
  if (!value) return 'Ainda não sincronizado';
  return `Última sincronização: ${new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export default function CloudSyncMenu({ cloudSync }) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const rootRef = React.useRef(null);
  const status = cloudSync?.status || 'unconfigured';
  const isBusy = ['connecting', 'syncing'].includes(status);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleAuth = async (mode) => {
    if (!email || !password) return;
    setSubmitting(true);
    const result = mode === 'signup'
      ? await cloudSync.signUp(email, password)
      : await cloudSync.signIn(email, password);
    setSubmitting(false);
    if (!result?.error && result?.data?.session) {
      setPassword('');
      setOpen(false);
    }
  };

  return (
    <div className="cloud-sync" ref={rootRef}>
      <button
        type="button"
        className={`cloud-sync-trigger cloud-sync-trigger--${status}`}
        aria-label="Conta e sincronização"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {cloudSync?.configured ? <Cloud size={16} /> : <CloudOff size={16} />}
        <span>{STATUS_LABELS[status]}</span>
      </button>

      {open && (
        <div className="cloud-sync-popover" role="dialog" aria-label="Conta e sincronização">
          {!cloudSync?.configured && (
            <div className="cloud-sync-empty">
              <CloudOff size={22} />
              <strong>Supabase não configurado</strong>
              <span>Os dados continuam protegidos neste navegador.</span>
            </div>
          )}

          {cloudSync?.configured && !cloudSync.user && (
            <form className="cloud-auth-form" onSubmit={event => { event.preventDefault(); handleAuth('signin'); }}>
              <div className="cloud-sync-popover-heading">
                <strong>Continuar em outros aparelhos</strong>
                <span>Entre com sua conta do Nexus Editais.</span>
              </div>
              <label htmlFor="cloud-email">E-mail</label>
              <input id="cloud-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
              <label htmlFor="cloud-password">Senha</label>
              <input id="cloud-password" type="password" minLength="8" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} />
              <div className="cloud-auth-actions">
                <button type="submit" disabled={submitting || !email || password.length < 8}>
                  <LogIn size={15} />
                  Entrar
                </button>
                <button type="button" className="secondary-action" disabled={submitting || !email || password.length < 8} onClick={() => handleAuth('signup')}>
                  Criar conta
                </button>
              </div>
            </form>
          )}

          {cloudSync?.configured && cloudSync.user && (
            <div className="cloud-account-panel">
              <div className="cloud-sync-popover-heading">
                <strong>{cloudSync.user.email}</strong>
                <span>{formatSyncTime(cloudSync.lastSyncedAt)}</span>
              </div>
              <div className="cloud-account-actions">
                <button type="button" disabled={isBusy} onClick={cloudSync.saveNow} title="Enviar a versão deste aparelho">
                  <CloudUpload size={15} />
                  Enviar
                </button>
                <button type="button" className="secondary-action" disabled={isBusy} onClick={cloudSync.loadNow} title="Carregar a versão salva na nuvem">
                  <CloudDownload size={15} />
                  Receber
                </button>
                <button type="button" className="icon-action" disabled={isBusy} onClick={cloudSync.saveNow} title="Sincronizar agora" aria-label="Sincronizar agora">
                  <RefreshCw size={16} className={isBusy ? 'is-spinning' : ''} />
                </button>
                <button type="button" className="icon-action danger-action" onClick={cloudSync.signOut} title="Sair da conta" aria-label="Sair da conta">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}

          {cloudSync?.message && <p className={`cloud-sync-message ${status === 'error' ? 'is-error' : ''}`}>{cloudSync.message}</p>}
        </div>
      )}
    </div>
  );
}
