/**
 * @module adapters/chatgpt-adapter
 * @description Adapter for ChatGPT — uses the filesystem-based shared workspace
 * approach. Writes task files and reads result files, enabling ChatGPT (running
 * in a browser/desktop app) to pick up and respond to tasks.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { watch } from 'chokidar';

/** Default workspace for ChatGPT file exchange */
const DEFAULT_WORKSPACE = path.resolve('..', 'shared-workspace');
/** How long to wait for a response file before timing out */
const DEFAULT_RESPONSE_TIMEOUT_MS = 300_000; // 5 minutes
/** Poll stabilization for response files */
const STABILITY_THRESHOLD_MS = 1000;

/**
 * @typedef {Object} ChatGPTAdapterOptions
 * @property {string} [workspacePath]
 * @property {number} [responseTimeoutMs]
 */

/**
 * ChatGPTAdapter — filesystem-based adapter.
 *
 * **How it works:**
 * 1. Orchestrator writes a task to `shared-workspace/_chatgpt/requests/{taskId}.json`
 * 2. ChatGPT (or a human) reads it and writes a response to
 *    `shared-workspace/_chatgpt/responses/{taskId}.json`
 * 3. This adapter watches for the response file and resolves the task.
 *
 * Implements: { name, type, isAvailable(), execute(task), getStatus() }
 */
export class ChatGPTAdapter {
  /** @type {string} */
  #workspacePath;
  /** @type {string} */
  #requestsDir;
  /** @type {string} */
  #responsesDir;
  /** @type {number} */
  #responseTimeoutMs;

  /**
   * @param {ChatGPTAdapterOptions} [options]
   */
  constructor(options = {}) {
    this.#workspacePath = options.workspacePath || DEFAULT_WORKSPACE;
    this.#requestsDir = path.join(this.#workspacePath, '_chatgpt', 'requests');
    this.#responsesDir = path.join(this.#workspacePath, '_chatgpt', 'responses');
    this.#responseTimeoutMs = options.responseTimeoutMs || DEFAULT_RESPONSE_TIMEOUT_MS;
  }

  /** @returns {string} */
  get name() {
    return 'chatgpt';
  }

  /** @returns {string} */
  get type() {
    return 'chatgpt';
  }

  /** @returns {string[]} */
  get capabilities() {
    return ['chat', 'creative', 'analysis', 'writing'];
  }

  /**
   * Check if the filesystem exchange directories exist and are writable.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      await fs.mkdir(this.#requestsDir, { recursive: true });
      await fs.mkdir(this.#responsesDir, { recursive: true });
      // Write a probe file and clean it up
      const probe = path.join(this.#requestsDir, '.probe');
      await fs.writeFile(probe, 'ok', 'utf-8');
      await fs.unlink(probe);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a task by writing a request file and watching for a response.
   *
   * @param {Object} task
   * @param {string} task.id
   * @param {string} task.prompt
   * @param {Object} [task.context]
   * @returns {Promise<Object>}
   */
  async execute(task) {
    // Ensure directories exist
    await fs.mkdir(this.#requestsDir, { recursive: true });
    await fs.mkdir(this.#responsesDir, { recursive: true });

    // Write request
    const requestFile = path.join(this.#requestsDir, `${task.id}.json`);
    const requestPayload = {
      id: task.id,
      prompt: task.prompt,
      context: task.context || {},
      requestedAt: new Date().toISOString(),
      instructions: 'Please process this task and write your response as a JSON file to the responses directory with the same filename.',
    };
    await fs.writeFile(requestFile, JSON.stringify(requestPayload, null, 2), 'utf-8');

    // Watch for response
    const start = Date.now();
    const responseFile = path.join(this.#responsesDir, `${task.id}.json`);

    const response = await this.#waitForResponse(responseFile);
    const durationMs = Date.now() - start;

    // Clean up request file
    try {
      await fs.unlink(requestFile);
    } catch {
      // non-critical
    }

    return {
      output: response.output || response.response || JSON.stringify(response),
      durationMs,
      adapter: this.name,
      source: 'filesystem',
    };
  }

  /**
   * Return current adapter status.
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const available = await this.isAvailable();

    // Count pending requests
    let pendingRequests = 0;
    try {
      const files = await fs.readdir(this.#requestsDir);
      pendingRequests = files.filter((f) => f.endsWith('.json')).length;
    } catch {
      // ignore
    }

    return {
      adapter: this.name,
      available,
      pendingRequests,
      requestsDir: this.#requestsDir,
      responsesDir: this.#responsesDir,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────

  /**
   * Watch for a response file to appear, read it, and return parsed content.
   * @private
   * @param {string} responseFile - Expected file path
   * @returns {Promise<Object>}
   */
  #waitForResponse(responseFile) {
    return new Promise((resolve, reject) => {
      const dir = path.dirname(responseFile);
      const basename = path.basename(responseFile);

      // Set up timeout
      const timer = setTimeout(() => {
        watcher.close();
        reject(new Error(`ChatGPT response timed out after ${this.#responseTimeoutMs}ms`));
      }, this.#responseTimeoutMs);

      const watcher = watch(dir, {
        persistent: true,
        ignoreInitial: false,
        awaitWriteFinish: { stabilityThreshold: STABILITY_THRESHOLD_MS, pollInterval: 200 },
      });

      const tryRead = async (filePath) => {
        if (path.basename(filePath) !== basename) return;
        try {
          const raw = await fs.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          clearTimeout(timer);
          await watcher.close();
          resolve(parsed);
        } catch {
          // file not ready yet — wait for next event
        }
      };

      watcher.on('add', tryRead);
      watcher.on('change', tryRead);

      watcher.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`Watcher error: ${err.message}`));
      });

      // Also check if file already exists
      fs.access(responseFile)
        .then(() => tryRead(responseFile))
        .catch(() => { /* file doesn't exist yet — fine */ });
    });
  }
}
