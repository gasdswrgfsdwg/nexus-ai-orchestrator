/**
 * @module adapters/openrouter-adapter
 * @description Adapter for OpenRouter — routes prompts to 200+ models via a
 * single OpenAI-compatible REST API. Requires OPENROUTER_API_KEY in the env.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

/**
 * @typedef {Object} OpenRouterAdapterOptions
 * @property {string} [apiKey]       - OpenRouter key (falls back to OPENROUTER_API_KEY)
 * @property {string} [model]        - Model slug (e.g. 'anthropic/claude-3-haiku')
 * @property {number} [timeoutMs]    - Per-request timeout (default 120 s)
 * @property {string} [siteUrl]      - Your site URL sent in HTTP-Referer header
 * @property {string} [siteName]     - Your site name sent in X-Title header
 */

/**
 * OpenRouterAdapter — calls the OpenRouter chat completions endpoint.
 * Uses OpenAI-compatible `/v1/chat/completions` format.
 * Implements: { name, type, isAvailable(), execute(task), getStatus() }
 */
export class OpenRouterAdapter {
  #apiKey;
  #model;
  #timeoutMs;
  #siteUrl;
  #siteName;
  #lastCheckAvailable = false;

  constructor(options = {}) {
    this.#apiKey   = options.apiKey   || process.env.OPENROUTER_API_KEY   || null;
    this.#model    = options.model    || process.env.OPENROUTER_MODEL      || DEFAULT_MODEL;
    this.#timeoutMs = options.timeoutMs ?? 120_000;
    this.#siteUrl  = options.siteUrl  || process.env.OPENROUTER_SITE_URL  || 'http://localhost:3001';
    this.#siteName = options.siteName || process.env.OPENROUTER_SITE_NAME || 'NEXUS AI Orchestrator';
  }

  get name() { return 'openrouter'; }
  get type() { return 'openrouter'; }
  get capabilities() { return ['code', 'analysis', 'creative', 'chat', 'reasoning', 'writing']; }

  /** @returns {boolean} Whether an API key is configured */
  get hasApiKey() { return !!this.#apiKey; }

  async isAvailable() {
    if (!this.#apiKey) {
      this.#lastCheckAvailable = false;
      return false;
    }
    this.#lastCheckAvailable = await this.#pingApi();
    return this.#lastCheckAvailable;
  }

  async execute(task) {
    if (!this.#apiKey) {
      throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in orchestrator/.env');
    }

    let content = task.prompt;
    if (task.context && Object.keys(task.context).length > 0) {
      content = `Context:\n${JSON.stringify(task.context, null, 2)}\n\nTask:\n${task.prompt}`;
    }

    return this.#callChatCompletions(content);
  }

  async getStatus() {
    const available = await this.isAvailable();
    return {
      adapter: this.name,
      available,
      model: this.#model,
      hasApiKey: this.hasApiKey,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────

  #headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.#apiKey}`,
      'HTTP-Referer': this.#siteUrl,
      'X-Title': this.#siteName,
    };
  }

  async #pingApi() {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 10_000);
    try {
      const res = await fetch(`${OPENROUTER_BASE}/auth/key`, {
        headers: this.#headers(),
        signal: ac.signal,
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async #callChatCompletions(content) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.#timeoutMs);

    const start = Date.now();
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: this.#headers(),
        body: JSON.stringify({
          model: this.#model,
          messages: [{ role: 'user', content }],
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${body}`);
      }

      const json = await res.json();
      const output = json?.choices?.[0]?.message?.content ?? '';

      return {
        output,
        model: json?.model || this.#model,
        durationMs: Date.now() - start,
        adapter: this.name,
        source: 'rest',
        usage: json?.usage ?? null,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
