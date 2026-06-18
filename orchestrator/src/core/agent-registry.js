/**
 * @module core/agent-registry
 * @description Registry of available AI agents. Tracks capabilities, limits,
 * current load, and health status for each registered agent.
 */

import { EventEmitter } from 'node:events';

/**
 * @typedef {Object} AgentInfo
 * @property {string}   name          - Unique agent identifier
 * @property {string}   type          - Adapter type (gemini | claude | chatgpt | ollama)
 * @property {string[]} capabilities  - e.g. ['code', 'analysis', 'creative', 'chat']
 * @property {number}   maxConcurrent - Max tasks this agent can handle at once
 * @property {number}   currentLoad   - Number of tasks currently assigned
 * @property {string}   status        - 'idle' | 'busy' | 'offline' | 'error'
 * @property {Object}   metadata      - Adapter-specific metadata (model, endpoint, etc.)
 * @property {number}   registeredAt  - Unix timestamp of registration
 * @property {number}   lastSeen      - Unix timestamp of last health check
 * @property {Object}   stats         - { tasksCompleted, tasksFailed, avgResponseMs }
 */

/**
 * AgentRegistry — maintains a live catalog of all available AI agents.
 *
 * @extends EventEmitter
 * @fires AgentRegistry#agent:registered    - A new agent was registered
 * @fires AgentRegistry#agent:unregistered  - An agent was removed
 * @fires AgentRegistry#agent:updated       - An agent's status changed
 */
export class AgentRegistry extends EventEmitter {
  /** @type {Map<string, AgentInfo>} */
  #agents = new Map();

  /**
   * Register a new agent or update an existing one.
   *
   * @param {Object} agentDef
   * @param {string}   agentDef.name
   * @param {string}   agentDef.type
   * @param {string[]} [agentDef.capabilities=[]]
   * @param {number}   [agentDef.maxConcurrent=1]
   * @param {Object}   [agentDef.metadata={}]
   * @returns {AgentInfo} The registered agent record
   */
  register({ name, type, capabilities = [], maxConcurrent = 1, metadata = {} }) {
    if (!name || !type) {
      throw new Error('Agent registration requires both "name" and "type".');
    }

    const existing = this.#agents.get(name);
    const now = Date.now();

    /** @type {AgentInfo} */
    const agent = {
      name,
      type,
      capabilities: [...new Set(capabilities)],
      maxConcurrent,
      currentLoad: existing?.currentLoad ?? 0,
      status: 'idle',
      metadata,
      registeredAt: existing?.registeredAt ?? now,
      lastSeen: now,
      stats: existing?.stats ?? { tasksCompleted: 0, tasksFailed: 0, avgResponseMs: 0 },
    };

    this.#agents.set(name, agent);
    this.emit(existing ? 'agent:updated' : 'agent:registered', agent);
    return agent;
  }

  /**
   * Remove an agent from the registry.
   *
   * @param {string} name
   * @returns {boolean} true if the agent was found and removed
   */
  unregister(name) {
    const agent = this.#agents.get(name);
    if (!agent) return false;
    this.#agents.delete(name);
    this.emit('agent:unregistered', agent);
    return true;
  }

  /**
   * Get a specific agent by name.
   *
   * @param {string} name
   * @returns {AgentInfo|undefined}
   */
  get(name) {
    const agent = this.#agents.get(name);
    return agent ? { ...agent } : undefined;
  }

  /**
   * List all registered agents.
   *
   * @returns {AgentInfo[]}
   */
  getAll() {
    return [...this.#agents.values()].map((a) => ({ ...a }));
  }

  /**
   * Get agents that are ready to accept work (not offline, not at max load).
   *
   * @returns {AgentInfo[]}
   */
  getAvailable() {
    return this.getAll().filter(
      (a) => a.status !== 'offline' && a.status !== 'error' && a.currentLoad < a.maxConcurrent,
    );
  }

  /**
   * Get agents whose capabilities include *at least one* of the requested capabilities.
   *
   * @param {string[]} requiredCapabilities
   * @returns {AgentInfo[]}
   */
  getByCapability(requiredCapabilities) {
    if (!requiredCapabilities?.length) return this.getAvailable();
    return this.getAvailable().filter((a) =>
      requiredCapabilities.some((cap) => a.capabilities.includes(cap)),
    );
  }

  /**
   * Increment the current load counter for an agent (task assigned).
   *
   * @param {string} name
   */
  incrementLoad(name) {
    const agent = this.#agents.get(name);
    if (!agent) return;
    agent.currentLoad = Math.min(agent.currentLoad + 1, agent.maxConcurrent);
    agent.status = agent.currentLoad >= agent.maxConcurrent ? 'busy' : 'idle';
    this.emit('agent:updated', { ...agent });
  }

  /**
   * Decrement the current load counter for an agent (task finished).
   *
   * @param {string} name
   */
  decrementLoad(name) {
    const agent = this.#agents.get(name);
    if (!agent) return;
    agent.currentLoad = Math.max(agent.currentLoad - 1, 0);
    agent.status = agent.currentLoad === 0 ? 'idle' : 'busy';
    this.emit('agent:updated', { ...agent });
  }

  /**
   * Update an agent's status field.
   *
   * @param {string} name
   * @param {'idle'|'busy'|'offline'|'error'} status
   */
  setStatus(name, status) {
    const agent = this.#agents.get(name);
    if (!agent) return;
    agent.status = status;
    agent.lastSeen = Date.now();
    this.emit('agent:updated', { ...agent });
  }

  /**
   * Record a completed task for stats tracking.
   *
   * @param {string} name
   * @param {number} durationMs - How long the task took
   * @param {boolean} [success=true]
   */
  recordTaskResult(name, durationMs, success = true) {
    const agent = this.#agents.get(name);
    if (!agent) return;

    if (success) {
      const total = agent.stats.tasksCompleted;
      agent.stats.avgResponseMs = Math.round(
        (agent.stats.avgResponseMs * total + durationMs) / (total + 1),
      );
      agent.stats.tasksCompleted += 1;
    } else {
      agent.stats.tasksFailed += 1;
    }
  }

  /**
   * Mark an agent as last-seen now (used by health monitor).
   *
   * @param {string} name
   */
  heartbeat(name) {
    const agent = this.#agents.get(name);
    if (agent) {
      agent.lastSeen = Date.now();
    }
  }

  /**
   * Get the total number of registered agents.
   * @returns {number}
   */
  get size() {
    return this.#agents.size;
  }
}
