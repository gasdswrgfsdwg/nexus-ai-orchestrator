/**
 * @module adapters/claude-adapter
 * @description Adapter for Claude Code CLI. Invokes `claude` via child_process
 * and returns structured results.
 */

import { spawn } from 'node:child_process';

/**
 * @typedef {Object} ClaudeAdapterOptions
 * @property {string} [command='claude']  - CLI command / path
 * @property {number} [timeoutMs=180000]  - Per-execution timeout (3 min default — Claude is thorough)
 * @property {string} [model]             - Model override
 */

/**
 * ClaudeAdapter — wraps the Claude Code CLI for use by the orchestrator.
 * Implements: { name, type, isAvailable(), execute(task), getStatus() }
 */
export class ClaudeAdapter {
  /** @type {string} */
  #command;
  /** @type {number} */
  #timeoutMs;
  /** @type {string|null} */
  #model;
  /** @type {boolean} */
  #lastCheckAvailable = false;

  /**
   * @param {ClaudeAdapterOptions} [options]
   */
  constructor(options = {}) {
    this.#command = options.command || 'claude';
    this.#timeoutMs = options.timeoutMs || 180_000;
    this.#model = options.model || null;
  }

  /** @returns {string} */
  get name() {
    return 'claude';
  }

  /** @returns {string} */
  get type() {
    return 'claude';
  }

  /** @returns {string[]} */
  get capabilities() {
    return ['code', 'analysis', 'creative', 'chat', 'reasoning', 'refactoring'];
  }

  /**
   * Check whether the Claude CLI is installed and reachable.
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
   * Execute a task using Claude Code CLI.
   * Uses the `--print` flag for non-interactive single-shot execution.
   *
   * @param {Object} task
   * @param {string} task.id
   * @param {string} task.prompt
   * @param {Object} [task.context]
   * @returns {Promise<Object>}
   */
  async execute(task) {
    const args = [this.#command, '--print'];

    if (this.#model) {
      args.push('--model', this.#model);
    }

    // Build prompt
    let fullPrompt = task.prompt;
    if (task.context && Object.keys(task.context).length > 0) {
      fullPrompt = `Context:\n${JSON.stringify(task.context, null, 2)}\n\nTask:\n${task.prompt}`;
    }

    args.push(fullPrompt);

    const start = Date.now();
    const result = await this.#runCommand(args, this.#timeoutMs);
    const durationMs = Date.now() - start;

    if (result.exitCode !== 0) {
      throw new Error(`Claude CLI exited with code ${result.exitCode}: ${result.stderr}`);
    }

    return {
      output: result.stdout.trim(),
      model: this.#model || 'default',
      durationMs,
      adapter: this.name,
    };
  }

  /**
   * Return current adapter status.
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

  // ─── Private ───────────────────────────────────────────────────────

  /**
   * @private
   * @param {string[]} args
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
