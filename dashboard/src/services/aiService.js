/**
 * aiService — ponte do dashboard para a IA real (Claude Code via orquestrador).
 *
 * Em desenvolvimento, o Vite faz proxy de /api -> http://localhost:3001 (o
 * orquestrador), que invoca `claude` de verdade. Em produção (GitHub Pages) nao
 * ha backend: as chamadas falham e o chamador faz fallback para texto mock.
 *
 * Toda funcao retorna { ok: boolean, text?: string, error?: string } e NUNCA
 * lanca — assim a UI degrada graciosamente sem try/catch espalhado.
 */

const AI_ENDPOINT = '/api/ai/generate';
const DEFAULT_TIMEOUT_MS = 150_000; // Claude pode demorar; damos folga

async function postGenerate(kind, payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
  // Sem fetch (ambiente de teste/SSR) -> falha controlada.
  if (typeof fetch === 'undefined') {
    return { ok: false, error: 'fetch indisponivel' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, payload }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!data || data.success !== true || !data.text) {
      return { ok: false, error: data?.error || 'resposta vazia' };
    }
    return { ok: true, text: data.text };
  } catch (err) {
    return { ok: false, error: err?.message || 'falha de rede' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gera o texto de uma secao da proposta (objetivos/justificativa/metodologia)
 * a partir dos dados do edital.
 * @param {{ secao: string, edital: object }} args
 */
export function gerarSecaoProposta({ secao, edital = {} }) {
  return postGenerate('secao-proposta', {
    secao,
    titulo: edital.titulo,
    orgao: edital.orgao,
    categoria: edital.categoria,
    valor: edital.valor,
  });
}

/**
 * Analisa o texto de um edital e devolve um resumo estruturado.
 * @param {{ texto?: string, edital?: object }} args
 */
export function analisarEdital({ texto, edital = {} }) {
  return postGenerate('analise-edital', { texto, titulo: edital.titulo });
}
