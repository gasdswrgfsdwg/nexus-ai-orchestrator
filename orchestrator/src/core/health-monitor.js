/**
 * @module core/health-monitor
 * @description Periodically pings registered agents to track responsiveness,
 * error rates, and response times. Auto-deregisters unresponsive agents.
 */

import { EventEmitter } from 'node:events';

/** Default interval between health checks (30 seconds) */
const DEFAULT_CHECK_INTERVAL_MS = 30_000;
/** How many consecutive failures before auto-deregistering */
const DEFAULT_MAX_FAILURES = 3;
/** Health check timeout per agent (10 seconds) */
const DEFAULT_PING_TIMEOUT_MS = 10_000;

/**
 * @typedef {Object} HealthRecord
 * @property {string}  agentName
 * @property {boolean} healthy
 * @property {number}  responseMs
 * @property {number}  consecutiveFailures
 * @property {string}  lastCheck          - ISO timestamp
 * @property {string}  [lastError]
 */

/**
 * HealthMonitor — runs periodic health checks against every registered agent.
 *
 * @extends EventEmitter
 * @fires HealthMonitor#health:check     - After each round of checks
 * @fires HealthMonitor#agent:unhealthy  - When an agent fails a health check
 * @fires HealthMonitor#agent:recovered  - When a previously-failing agent responds
 * @fires HealthMonitor#agent:deregistered - When an agent is auto-removed
 */
export class HealthMonitor extends EventEmitter {
  /** @type {import('./agent-registry.js').AgentRegistry} */
  #registry;
  /** @type {import('./blackboard.js').Blackboard} */
  #blackboard;
  /** @type {Map<string, Object>} adapter instances by agent type */
  #adapters = new Map();
  /** @type {Map<string, HealthRecord>} latest health state per agent */
  #healthRecords = new Map();
  /** @type {NodeJS.Timeout|null} */
  #timer = null;
  /** @type {number} */
  #intervalMs;
  /** @type {number} */
  #maxFailures;
  /** @type {number} */
  #pingTimeoutMs;
  /** @type {boolean} */
  #running = false;

  /**
   * @param {Object} deps
   * @param {import('./agent-registry.js').AgentRegistry} deps.registry
   * @param {import('./blackboard.js').Blackboard}       deps.blackboard
   * @param {Object} [options]
   * @param {number} [options.intervalMs=30000]
   * @param {number} [options.maxFailures=3]
   * @param {number} [options.pingTimeoutMs=10000]
   */
  constructor({ registry, blackboard }, options = {}) {
    super();
    this.#registry = registry;
    this.#blackboard = blackboard;
    this.#intervalMs = options.intervalMs ?? DEFAULT_CHECK_INTERVAL_MS;
    this.#maxFailures = options.maxFailures ?? DEFAULT_MAX_FAILURES;
    this.#pingTimeoutMs = options.pingTimeoutMs ?? DEFAULT_PING_TIMEOUT_MS;
  }

  /**
   * Register an adapter for health-checking agents of a given type.
   * @param {string} type
   * @param {Object} adapter - Must implement `getStatus()` returning a promise
   */
  registerAdapter(type, adapter) {
    this.#adapters.set(type, adapter);
  }

  /**
   * Start periodic health checks.
   * @returns {void}
   */
  start() {
    if (this.#running) return;
    this.#running = true;

    // Run first check immediately
    this.#runChecks();

    this.#timer = setInterval(() => this.#runChecks(), this.#intervalMs);
  }

  /**
   * Stop periodic health checks.
   * @returns {void}
   */
  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#running = false;
  }

  /**
   * Get the health report for all agents.
   * @returns {HealthRecord[]}
   */
  getHealthReport() {
    return [...this.#healthRecords.values()];
  }

  /**
   * Get the health record for a single agent.
   * @param {string} agentName
   * @returns {HealthRecord|undefined}
   */
  getAgentHealth(agentName) {
    return this.#healthRecords.get(agentName);
  }

  /**
   * Get a high-level system health summary.
   * @returns {Object}
   */
  getSystemHealth() {
    const agents = this.#registry.getAll();
    const records = this.getHealthReport();
    const healthy = records.filter((r) => r.healthy).length;
    const unhealthy = records.filter((r) => !r.healthy).length;

    return {
      totalAgents: agents.length,
      healthyAgents: healthy,
      unhealthyAgents: unhealthy,
      monitorRunning: this.#running,
      checkIntervalMs: this.#intervalMs,
      lastCheckAt: records.length > 0
        ? records.reduce((latest, r) => (r.lastCheck > latest ? r.lastCheck : latest), '')
        : null,
      agents: records,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────

  /**
   * Run a complete round of health checks across all registered agents.
   * @private
   */
  async #runChecks() {
    const agents = this.#registry.getAll();
    const results = await Promise.allSettled(
      agents.map((agent) => this.#checkAgent(agent)),
    );

    // Persist health data to the blackboard
    try {
      const healthData = {
        checkedAt: new Date().toISOString(),
        agents: Object.fromEntries(this.#healthRecords),
      };
      await this.#blackboard.writeConfig('health-report', healthData);
    } catch {
      // non-critical
    }

    this.emit('health:check', this.getHealthReport());
  }

  /**
   * Check a single agent's health by calling its adapter's getStatus().
   * @private
   * @param {import('./agent-registry.js').AgentInfo} agent
   */
  async #checkAgent(agent) {
    const adapter = this.#adapters.get(agent.type);
    const existing = this.#healthRecords.get(agent.name) || {
      agentName: agent.name,
      healthy: true,
      responseMs: 0,
      consecutiveFailures: 0,
      lastCheck: null,
      lastError: null,
    };

    if (!adapter) {
      // No adapter registered — mark as unknown but don't penalize
      existing.lastCheck = new Date().toISOString();
      this.#healthRecords.set(agent.name, existing);
      return;
    }

    const start = Date.now();
    try {
      // Race between the actual check and a timeout
      const statusPromise = adapter.getStatus();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timed out')), this.#pingTimeoutMs),
      );

      await Promise.race([statusPromise, timeoutPromise]);

      const responseMs = Date.now() - start;
      const wasFailing = existing.consecutiveFailures > 0;

      existing.healthy = true;
      existing.responseMs = responseMs;
      existing.consecutiveFailures = 0;
      existing.lastCheck = new Date().toISOString();
      existing.lastError = null;

      this.#registry.heartbeat(agent.name);

      if (wasFailing) {
        this.#registry.setStatus(agent.name, 'idle');
        this.emit('agent:recovered', { agentName: agent.name, responseMs });
        await this.#blackboard.writeLog('health', `Agent "${agent.name}" recovered (${responseMs}ms)`);
      }
    } catch (err) {
      existing.healthy = false;
      existing.responseMs = Date.now() - start;
      existing.consecutiveFailures += 1;
      existing.lastCheck = new Date().toISOString();
      existing.lastError = err.message;

      this.emit('agent:unhealthy', {
        agentName: agent.name,
        error: err.message,
        consecutiveFailures: existing.consecutiveFailures,
      });

      await this.#blackboard.writeLog(
        'health',
        `Agent "${agent.name}" unhealthy (failure ${existing.consecutiveFailures}/${this.#maxFailures}): ${err.message}`,
      );

      // Auto-deregister after too many consecutive failures
      if (existing.consecutiveFailures >= this.#maxFailures) {
        this.#registry.setStatus(agent.name, 'offline');
        this.emit('agent:deregistered', { agentName: agent.name, reason: 'max failures exceeded' });
        await this.#blackboard.writeLog(
          'health',
          `Agent "${agent.name}" auto-deregistered after ${this.#maxFailures} consecutive failures`,
        );
      }
    }

    // Update the blackboard status file
    await this.#blackboard.updateAgentStatus(agent.name, {
      healthy: existing.healthy,
      responseMs: existing.responseMs,
      consecutiveFailures: existing.consecutiveFailures,
      status: this.#registry.get(agent.name)?.status || 'unknown',
    });

    this.#healthRecords.set(agent.name, existing);
  }
}
