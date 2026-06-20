/**
 * @module adapters/gemini-adapter
 * @description Adapter for Google Gemini. Prefers the REST API when
 * GEMINI_API_KEY is set; falls back to the `gemini` CLI otherwise.
 */

import { spawn } from 'node:child_process';

const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_REST_MODEL = 'gemini-2.0-flash';

/**
 * @typedef {Object} GeminiAdapterOptions
 * @property {string} [command='gemini']  - CLI command / path
 * @property {number} [timeoutMs=120000]  - Per-execution timeout
 * @property {string} [model]             - Model override (e.g. 'gemini-2.0-flash')
 * @property {string} [apiKey]            - Google API key (falls back to GEMINI_API_KEY env)
 */

/**
 * GeminiAdapter — wraps Google Gemini for the orchestrator.
 * Uses the REST API when an API key is available, otherwise the CLI.
 * Implements: { name, type, isAvailable(), execute(task), getStatus() }
 */
export class GeminiAdapter {
  /** @type {string} */
  #command;
  /** @type {number} */
  #timeoutMs;
  /** @type {string} */
  #model;
  /** @type {string|null} */
  #apiKey;
  /** @type {boolean} */
  #lastCheckAvailable = false;

  /**
   * @param {GeminiAdapterOptions} [options]
   */
  constructor(options = {}) {
    this.#command = options.command || 'gemini';
    this.#timeoutMs = options.timeoutMs || 120_000;
    this.#model = options.model || DEFAULT_REST_MODEL;
    this.#apiKey = options.apiKey || process.env.GEMINI_API_KEY || null;
  }

  get name() { return 'gemini'; }
  get type() { return 'gemini'; }
  get capabilities() { return ['code', 'analysis', 'creative', 'chat', 'reasoning']; }

  /** @returns {'rest'|'cli'} Active connection mode */
  get mode() { return this.#apiKey ? 'rest' : 'cli'; }

  /**
   * Returns true if the REST API key is set (fast check) or the CLI responds.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    if (this.#apiKey) {
      this.#lastCheckAvailable = await this.#pingRestApi();
    } else {
      try {
        const result = await this.#runCommand([this.#command, '--version'], 10_000);
        this.#lastCheckAvailable = result.exitCode === 0;
      } catch {
        this.#lastCheckAvailable = false;
      }
    }
    return this.#lastCheckAvailable;
  }

  /**
   * Execute a task via REST API (if key set) or CLI.
   * @param {Object} task
   * @param {string} task.id
   * @param {string} task.prompt
   * @param {Object} [task.context]
   * @returns {Promise<Object>}
   */
  async execute(task) {
    let fullPrompt = task.prompt;
    if (task.context && Object.keys(task.context).length > 0) {
      fullPrompt = `Context:\n${JSON.stringify(task.context, null, 2)}\n\nTask:\n${task.prompt}`;
    }

    if (this.#apiKey) {
      return this.#executeViaRest(fullPrompt);
    }
    return this.#executeViaCli(fullPrompt);
  }

  /**
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const available = await this.isAvailable();
    return {
      adapter: this.name,
      available,
      mode: this.mode,
      model: this.#model,
      ...(this.mode === 'cli' ? { command: this.#command } : {}),
    };
  }

  // ─── REST API ──────────────────────────────────────────────────────

  async #pingRestApi() {
    try {
      const url = `${GEMINI_REST_BASE}?key=${this.#apiKey}`;
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 10_000);
      const res = await fetch(url, { signal: ac.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  async #executeViaRest(prompt) {
    const model = this.#model;
    const url = `${GEMINI_REST_BASE}/${model}:generateContent?key=${this.#apiKey}`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.#timeoutMs);

    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gemini REST error ${res.status}: ${body}`);
      }

      const json = await res.json();
      const output = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      return {
        output,
        model,
        durationMs: Date.now() - start,
        adapter: this.name,
        source: 'rest',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // ─── CLI fallback ──────────────────────────────────────────────────

  async #executeViaCli(prompt) {
    const args = [this.#command];
    if (this.#model) args.push('--model', this.#model);
    args.push('--prompt', prompt);

    const start = Date.now();
    const result = await this.#runCommand(args, this.#timeoutMs);

    if (result.exitCode !== 0) {
      throw new Error(`Gemini CLI exited with code ${result.exitCode}: ${result.stderr}`);
    }

    return {
      output: result.stdout.trim(),
      model: this.#model,
      durationMs: Date.now() - start,
      adapter: this.name,
      source: 'cli',
    };
  }

  #runCommand(args, timeoutMs) {
    return new Promise((resolve, reject) => {
      const [cmd, ...flags] = args;
      const proc = spawn(cmd, flags, { shell: true, timeout: timeoutMs, windowsHide: true });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (c) => { stdout += c.toString(); });
      proc.stderr?.on('data', (c) => { stderr += c.toString(); });
      proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }));
      proc.on('error', (err) => reject(new Error(`Failed to spawn "${cmd}": ${err.message}`)));
    });
  }
}
