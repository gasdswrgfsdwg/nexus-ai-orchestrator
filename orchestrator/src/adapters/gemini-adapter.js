/**
 * @module adapters/gemini-adapter
 * @description Adapter for Google Gemini CLI. Invokes the `gemini` command-line
 * tool via child_process and returns structured results.
 */

import { spawn } from 'node:child_process';

/**
 * @typedef {Object} GeminiAdapterOptions
 * @property {string} [command='gemini']  - CLI command / path
 * @property {number} [timeoutMs=120000]  - Per-execution timeout
 * @property {string} [model]             - Model override (e.g. 'gemini-2.0-flash')
 */

/**
 * GeminiAdapter — wraps the Gemini CLI for use by the orchestrator.
 * Implements the standard adapter interface: { name, type, isAvailable(), execute(task), getStatus() }
 */
export class GeminiAdapter {
  /** @type {string} */
  #command;
  /** @type {number} */
  #timeoutMs;
  /** @type {string|null} */
  #model;
  /** @type {boolean} */
  #lastCheckAvailable = false;

  /**
   * @param {GeminiAdapterOptions} [options]
   */
  constructor(options = {}) {
    this.#command = options.command || 'gemini';
    this.#timeoutMs = options.timeoutMs || 120_000;
    this.#model = options.model || null;
  }

  /** @returns {string} Adapter display name */
  get name() {
    return 'gemini';
  }

  /** @returns {string} Adapter type identifier */
  get type() {
    return 'gemini';
  }

  /** @returns {string[]} Capabilities this adapter provides */
  get capabilities() {
    return ['code', 'analysis', 'creative', 'chat', 'reasoning'];
  }

  /**
   * Check whether the Gemini CLI is installed and reachable.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const result = await this.#runCommand([this.#command, '--version'], 10_000);
      this.#lastCheckAvailable = result.exitCode === 0;
    } catch {
      this.#lastCheckAvailable = false;
    }
    return this.#lastCheckAvailable;
  }

  /**
   * Execute a task by invoking the Gemini CLI with the task prompt.
   *
   * @param {Object} task
   * @param {string} task.id
   * @param {string} task.prompt
   * @param {Object} [task.context]
   * @returns {Promise<Object>} - { output, model, durationMs }
   */
  async execute(task) {
    const args = [this.#command];

    if (this.#model) {
      args.push('--model', this.#model);
    }

    // Build the full prompt with optional context
    let fullPrompt = task.prompt;
    if (task.context && Object.keys(task.context).length > 0) {
      fullPrompt = `Context:\n${JSON.stringify(task.context, null, 2)}\n\nTask:\n${task.prompt}`;
    }

    args.push('--prompt', fullPrompt);

    const start = Date.now();
    const result = await this.#runCommand(args, this.#timeoutMs);
    const durationMs = Date.now() - start;

    if (result.exitCode !== 0) {
      throw new Error(`Gemini CLI exited with code ${result.exitCode}: ${result.stderr}`);
    }

    return {
      output: result.stdout.trim(),
      model: this.#model || 'default',
      durationMs,
      adapter: this.name,
    };
  }

  /**
   * Return current adapter status for health monitoring.
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const available = await this.isAvailable();
    return {
      adapter: this.name,
      available,
      command: this.#command,
      model: this.#model,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────

  /**
   * Spawn a process and collect stdout/stderr.
   * @private
   * @param {string[]} args - [command, ...flags]
   * @param {number} timeoutMs
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   */
  #runCommand(args, timeoutMs) {
    return new Promise((resolve, reject) => {
      const [cmd, ...flags] = args;
      const proc = spawn(cmd, flags, {
        shell: true,
        timeout: timeoutMs,
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
      proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn "${cmd}": ${err.message}`));
      });
    });
  }
}
