/**
 * @module core/blackboard
 * @description File-system based communication layer using the Blackboard Pattern.
 * All inter-agent communication happens through a shared folder structure with
 * _inbox/, _outbox/, _status/, _logs/, _config/ subdirectories.
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { watch } from 'chokidar';
import { v4 as uuidv4 } from 'uuid';

/** @type {string} Default shared workspace root */
const DEFAULT_WORKSPACE = path.resolve('..', 'shared-workspace');

/**
 * @typedef {Object} BlackboardOptions
 * @property {string}  [workspacePath] - Root path to the shared workspace
 * @property {number}  [pollInterval]  - Chokidar poll interval in ms (default 1000)
 */

/**
 * Blackboard — the central nervous system of the orchestrator.
 * Watches the filesystem for new task files and coordinates reads/writes
 * across the shared workspace subdirectories.
 *
 * @extends EventEmitter
 * @fires Blackboard#task:new        - When a new task file lands in _inbox/
 * @fires Blackboard#task:completed   - When a result is written to _outbox/
 * @fires Blackboard#error            - On any I/O error
 */
export class Blackboard extends EventEmitter {
  /** @type {string} */
  #workspacePath;
  /** @type {Record<string, string>} */
  #dirs;
  /** @type {import('chokidar').FSWatcher | null} */
  #watcher = null;
  /** @type {boolean} */
  #initialized = false;

  /**
   * @param {BlackboardOptions} [options]
   */
  constructor(options = {}) {
    super();
    this.#workspacePath = options.workspacePath || DEFAULT_WORKSPACE;
    this.#dirs = {
      inbox:  path.join(this.#workspacePath, '_inbox'),
      outbox: path.join(this.#workspacePath, '_outbox'),
      status: path.join(this.#workspacePath, '_status'),
      logs:   path.join(this.#workspacePath, '_logs'),
      config: path.join(this.#workspacePath, '_config'),
    };
  }

  /** @returns {string} Absolute path to the shared workspace */
  get workspacePath() {
    return this.#workspacePath;
  }

  /** @returns {Record<string, string>} Map of subdirectory names to absolute paths */
  get dirs() {
    return { ...this.#dirs };
  }

  /**
   * Ensure every required subdirectory exists, then start file-watching.
   * Safe to call multiple times — subsequent calls are no-ops.
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.#initialized) return;

    // Create directory tree
    for (const dir of Object.values(this.#dirs)) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Seed agents-status.json if missing
    const statusFile = path.join(this.#dirs.status, 'agents-status.json');
    try {
      await fs.access(statusFile);
    } catch {
      await this.#atomicWrite(statusFile, JSON.stringify({ agents: {}, lastUpdated: new Date().toISOString() }, null, 2));
    }

    this.#startWatcher();
    this.#initialized = true;
    await this.writeLog('system', 'Blackboard initialized');
  }

  /**
   * Gracefully stop the file watcher and clean up.
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (this.#watcher) {
      await this.#watcher.close();
      this.#watcher = null;
    }
    this.#initialized = false;
    await this.writeLog('system', 'Blackboard shut down');
  }

  // ─── Inbox operations ──────────────────────────────────────────────

  /**
   * Write a new task file into _inbox/.
   *
   * @param {Object} task - Task payload (must include at least `type`)
   * @returns {Promise<string>} The generated task ID
   */
  async submitTask(task) {
    const id = task.id || uuidv4();
    const enriched = {
      id,
      ...task,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    const filePath = path.join(this.#dirs.inbox, `${id}.json`);
    await this.#atomicWrite(filePath, JSON.stringify(enriched, null, 2));
    await this.writeLog('task', `Task submitted: ${id} (${task.type || 'unknown'})`);
    return id;
  }

  /**
   * Read and parse a task file from _inbox/.
   * @param {string} taskId
   * @returns {Promise<Object|null>}
   */
  async readTask(taskId) {
    try {
      const raw = await fs.readFile(path.join(this.#dirs.inbox, `${taskId}.json`), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * List all pending tasks in _inbox/.
   * @returns {Promise<Object[]>}
   */
  async listInboxTasks() {
    return this.#readJsonDir(this.#dirs.inbox);
  }

  /**
   * Remove a task file from _inbox/ (after dispatch).
   * @param {string} taskId
   * @returns {Promise<void>}
   */
  async consumeTask(taskId) {
    const filePath = path.join(this.#dirs.inbox, `${taskId}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // already consumed — safe to ignore
    }
  }

  // ─── Outbox operations ─────────────────────────────────────────────

  /**
   * Write a task result to _outbox/.
   *
   * @param {string} taskId
   * @param {Object} result - Result payload
   * @returns {Promise<void>}
   */
  async writeResult(taskId, result) {
    const payload = {
      taskId,
      ...result,
      completedAt: new Date().toISOString(),
    };
    const filePath = path.join(this.#dirs.outbox, `${taskId}.json`);
    await this.#atomicWrite(filePath, JSON.stringify(payload, null, 2));
    this.emit('task:completed', payload);
    await this.writeLog('task', `Result written: ${taskId}`);
  }

  /**
   * Read a result from _outbox/.
   * @param {string} taskId
   * @returns {Promise<Object|null>}
   */
  async readResult(taskId) {
    try {
      const raw = await fs.readFile(path.join(this.#dirs.outbox, `${taskId}.json`), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * List all results in _outbox/.
   * @returns {Promise<Object[]>}
   */
  async listResults() {
    return this.#readJsonDir(this.#dirs.outbox);
  }

  // ─── Status operations ─────────────────────────────────────────────

  /**
   * Update a single agent's entry inside _status/agents-status.json.
   *
   * @param {string} agentName
   * @param {Object} statusData
   * @returns {Promise<void>}
   */
  async updateAgentStatus(agentName, statusData) {
    const filePath = path.join(this.#dirs.status, 'agents-status.json');
    let current = { agents: {} };
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      current = JSON.parse(raw);
    } catch {
      // start fresh
    }
    current.agents[agentName] = { ...statusData, updatedAt: new Date().toISOString() };
    current.lastUpdated = new Date().toISOString();
    await this.#atomicWrite(filePath, JSON.stringify(current, null, 2));
  }

  /**
   * Read the full agents-status.json.
   * @returns {Promise<Object>}
   */
  async readAgentStatuses() {
    try {
      const raw = await fs.readFile(path.join(this.#dirs.status, 'agents-status.json'), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return { agents: {}, lastUpdated: null };
    }
  }

  // ─── Log operations ────────────────────────────────────────────────

  /**
   * Append a timestamped log entry to _logs/{category}-{date}.log
   *
   * @param {string} category - e.g. 'system', 'task', 'health'
   * @param {string} message
   * @returns {Promise<void>}
   */
  async writeLog(category, message) {
    const date = new Date().toISOString().slice(0, 10);
    const filePath = path.join(this.#dirs.logs, `${category}-${date}.log`);
    const entry = `[${new Date().toISOString()}] ${message}\n`;
    try {
      await fs.appendFile(filePath, entry, 'utf-8');
    } catch (err) {
      // Avoid infinite loops — don't try to log log-write failures
      this.emit('error', new Error(`Log write failed: ${err.message}`));
    }
  }

  // ─── Config operations ─────────────────────────────────────────────

  /**
   * Read a JSON config file from _config/.
   * @param {string} name - Config filename without extension
   * @returns {Promise<Object|null>}
   */
  async readConfig(name) {
    try {
      const raw = await fs.readFile(path.join(this.#dirs.config, `${name}.json`), 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Write a JSON config file to _config/.
   * @param {string} name
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async writeConfig(name, data) {
    const filePath = path.join(this.#dirs.config, `${name}.json`);
    await this.#atomicWrite(filePath, JSON.stringify(data, null, 2));
  }

  // ─── Private helpers ───────────────────────────────────────────────

  /**
   * Start chokidar watcher on _inbox/.
   * @private
   */
  #startWatcher() {
    const inboxGlob = path.join(this.#dirs.inbox, '*.json');

    this.#watcher = watch(inboxGlob, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    this.#watcher.on('add', async (filePath) => {
      try {
        const raw = await fs.readFile(filePath, 'utf-8');
        const task = JSON.parse(raw);
        this.emit('task:new', task);
      } catch (err) {
        this.emit('error', new Error(`Failed to read new task file ${filePath}: ${err.message}`));
      }
    });

    this.#watcher.on('error', (err) => {
      this.emit('error', new Error(`Watcher error: ${err.message}`));
    });
  }

  /**
   * Atomic write — write to a .tmp file then rename for crash safety.
   * @private
   * @param {string} filePath
   * @param {string} content
   */
  async #atomicWrite(filePath, content) {
    const tmp = `${filePath}.tmp`;
    await fs.writeFile(tmp, content, 'utf-8');
    await fs.rename(tmp, filePath);
  }

  /**
   * Read every .json file in a directory and return parsed objects.
   * @private
   * @param {string} dirPath
   * @returns {Promise<Object[]>}
   */
  async #readJsonDir(dirPath) {
    const results = [];
    try {
      const entries = await fs.readdir(dirPath);
      for (const entry of entries) {
        if (!entry.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(dirPath, entry), 'utf-8');
          results.push(JSON.parse(raw));
        } catch {
          // skip unparseable files
        }
      }
    } catch {
      // directory may not exist yet
    }
    return results;
  }
}
