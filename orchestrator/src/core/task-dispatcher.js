/**
 * @module core/task-dispatcher
 * @description Routes incoming tasks to the most appropriate agent using
 * configurable dispatch strategies. Handles queuing, retries, and timeouts.
 */

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';

/** Default timeout for a single task execution (5 minutes) */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
/** Default maximum retry attempts */
const DEFAULT_MAX_RETRIES = 2;

/**
 * @typedef {Object} TaskRecord
 * @property {string}  id
 * @property {string}  type           - e.g. 'code', 'analysis', 'creative'
 * @property {string}  prompt         - The actual prompt / instruction
 * @property {Object}  [context]      - Additional context data
 * @property {string}  priority       - normal | high
 * @property {string[]} tags          - Routing and policy tags
 * @property {string}  status         - pending | queued | running | completed | failed
 * @property {string}  [assignedTo]   - Agent name
 * @property {number}  retries        - Number of retries so far
 * @property {number}  maxRetries
 * @property {number}  timeoutMs
 * @property {string}  createdAt
 * @property {string}  [startedAt]
 * @property {string}  [completedAt]
 * @property {Object}  [result]
 * @property {string}  [error]
 * @property {string}  strategy       - Strategy used for dispatch
 * @property {Object}  [routing]      - Resolved declarative routing metadata
 */

/**
 * TaskDispatcher — accepts tasks, matches them to agents, and manages
 * the full lifecycle: queue → dispatch → execute → result/retry.
 *
 * @extends EventEmitter
 * @fires TaskDispatcher#task:queued     - Task added to the queue
 * @fires TaskDispatcher#task:dispatched - Task sent to an agent
 * @fires TaskDispatcher#task:completed  - Agent returned a result
 * @fires TaskDispatcher#task:failed     - Task failed after all retries
 * @fires TaskDispatcher#task:timeout    - Task timed out
 * @fires TaskDispatcher#task:retrying   - Task is being retried
 */
export class TaskDispatcher extends EventEmitter {
  /** @type {import('./agent-registry.js').AgentRegistry} */
  #registry;
  /** @type {import('./blackboard.js').Blackboard} */
  #blackboard;
  /** @type {import('../routing/routing-engine.js').RoutingEngine|null} */
  #routingEngine;
  /** @type {Map<string, Object>} strategy name → strategy instance */
  #strategies = new Map();
  /** @type {string} default strategy name */
  #defaultStrategy = 'round-robin';
  /** @type {Map<string, TaskRecord>} all tasks by id */
  #tasks = new Map();
  /** @type {TaskRecord[]} tasks waiting for an agent */
  #queue = [];
  /** @type {Map<string, Function>} adapter execute functions by agent type */
  #adapters = new Map();
  /** @type {Map<string, NodeJS.Timeout>} active timeout timers by task id */
  #timeouts = new Map();

  /**
   * @param {Object} deps
   * @param {import('./agent-registry.js').AgentRegistry} deps.registry
   * @param {import('./blackboard.js').Blackboard} deps.blackboard
   * @param {import('../routing/routing-engine.js').RoutingEngine} [deps.routingEngine]
   */
  constructor({ registry, blackboard, routingEngine = null }) {
    super();
    this.#registry = registry;
    this.#blackboard = blackboard;
    this.#routingEngine = routingEngine;
  }

  // ─── Configuration ─────────────────────────────────────────────────

  /**
   * Register a dispatch strategy.
   * @param {string} name
   * @param {Object} strategy - Must implement `select(agents, task)`
   */
  addStrategy(name, strategy) {
    this.#strategies.set(name, strategy);
  }

  /**
   * Set the default dispatch strategy.
   * @param {string} name
   */
  setDefaultStrategy(name) {
    if (!this.#strategies.has(name)) {
      throw new Error(`Strategy "${name}" is not registered.`);
    }
    this.#defaultStrategy = name;
  }

  /**
   * Register an adapter's execute function keyed by agent type.
   * @param {string} type - e.g. 'gemini', 'claude'
   * @param {Object} adapter - Must implement `execute(task)` and `name`
   */
  registerAdapter(type, adapter) {
    this.#adapters.set(type, adapter);
  }

  // ─── Task submission ───────────────────────────────────────────────

  /**
   * Submit a new task for dispatch.
   *
   * @param {Object} taskInput
   * @param {string}   taskInput.type          - Task category
   * @param {string}   taskInput.prompt        - Instruction / prompt
   * @param {Object}   [taskInput.context]     - Extra context
   * @param {string}   [taskInput.priority]
   * @param {string[]} [taskInput.tags]
   * @param {string}   [taskInput.strategy]    - Override default strategy
   * @param {number}   [taskInput.timeoutMs]
   * @param {number}   [taskInput.maxRetries]
   * @param {string[]} [taskInput.requiredCapabilities]
   * @returns {TaskRecord}
   */
  submit(taskInput) {
    if (taskInput.id && this.#tasks.has(taskInput.id)) {
      return { ...this.#tasks.get(taskInput.id) };
    }

    const routedInput = this.#routingEngine
      ? this.#routingEngine.resolve(taskInput)
      : taskInput;

    /** @type {TaskRecord} */
    const task = {
      id: routedInput.id || uuidv4(),
      type: routedInput.type || 'general',
      prompt: routedInput.prompt || '',
      context: routedInput.context || {},
      priority: routedInput.priority || routedInput.context?.priority || 'normal',
      tags: routedInput.tags || routedInput.context?.tags || [],
      status: 'queued',
      assignedTo: null,
      retries: 0,
      maxRetries: routedInput.maxRetries ?? DEFAULT_MAX_RETRIES,
      timeoutMs: routedInput.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      strategy: routedInput.strategy || this.#defaultStrategy,
      requiredCapabilities: routedInput.requiredCapabilities || [routedInput.type],
      routing: routedInput.routing || null,
    };

    this.#tasks.set(task.id, task);
    this.#queue.push(task);
    this.emit('task:queued', task);

    // Attempt immediate dispatch
    this.#processQueue();

    return { ...task };
  }

  // ─── Queue processing ──────────────────────────────────────────────

  /**
   * Try to dispatch every queued task.
   * Called after submission and whenever an agent finishes work.
   * @private
   */
  async #processQueue() {
    const stillQueued = [];

    for (const task of this.#queue) {
      const dispatched = await this.#tryDispatch(task);
      if (!dispatched) {
        stillQueued.push(task);
      }
    }

    this.#queue = stillQueued;
  }

  /**
   * Attempt to dispatch a single task.
   * @private
   * @param {TaskRecord} task
   * @returns {Promise<boolean>} true if successfully dispatched
   */
  async #tryDispatch(task) {
    // Pick strategy
    const strategyName = task.strategy || this.#defaultStrategy;
    const strategy = this.#strategies.get(strategyName);
    if (!strategy) {
      task.status = 'failed';
      task.error = `Unknown strategy: ${strategyName}`;
      this.emit('task:failed', { ...task });
      return true; // remove from queue (terminal state)
    }

    // Get candidate agents
    let candidates = this.#registry.getByCapability(task.requiredCapabilities);
    candidates = this.#applyRoutingConstraints(candidates, task.routing);
    if (candidates.length === 0) return false; // stay in queue

    // Let strategy pick
    const chosen = strategy.select(candidates, task);
    if (!chosen) return false;

    // Check adapter availability
    const adapter = this.#adapters.get(chosen.type);
    if (!adapter) {
      task.status = 'failed';
      task.error = `No adapter registered for type "${chosen.type}"`;
      this.emit('task:failed', { ...task });
      return true;
    }

    // Dispatch!
    task.status = 'running';
    task.assignedTo = chosen.name;
    task.startedAt = new Date().toISOString();
    this.#registry.incrementLoad(chosen.name);
    this.emit('task:dispatched', { ...task });

    // Set timeout
    const timer = setTimeout(() => this.#handleTimeout(task.id), task.timeoutMs);
    this.#timeouts.set(task.id, timer);

    // Execute asynchronously
    this.#executeTask(task, adapter);

    return true;
  }

  /**
   * Execute a task through the selected adapter.
   * @private
   * @param {TaskRecord} task
   * @param {Object} adapter
   */
  async #executeTask(task, adapter) {
    const startTime = Date.now();
    try {
      const result = await adapter.execute({
        id: task.id,
        type: task.type,
        prompt: task.prompt,
        context: task.context,
      });

      // Clear timeout
      this.#clearTimeout(task.id);

      const durationMs = Date.now() - startTime;

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date().toISOString();

      this.#registry.decrementLoad(task.assignedTo);
      this.#registry.recordTaskResult(task.assignedTo, durationMs, true);

      // Write result to blackboard
      await this.#blackboard.writeResult(task.id, {
        agentName: task.assignedTo,
        result,
        durationMs,
      });

      this.emit('task:completed', { ...task });
      await this.#blackboard.writeLog('task', `Task ${task.id} completed by ${task.assignedTo} in ${durationMs}ms`);
    } catch (err) {
      this.#clearTimeout(task.id);
      const durationMs = Date.now() - startTime;

      this.#registry.decrementLoad(task.assignedTo);
      this.#registry.recordTaskResult(task.assignedTo, durationMs, false);

      await this.#handleFailure(task, err.message);
    }

    // Process queue — an agent may now be free
    this.#processQueue();
  }

  /**
   * Handle a task that exceeded its timeout.
   * @private
   * @param {string} taskId
   */
  async #handleTimeout(taskId) {
    const task = this.#tasks.get(taskId);
    if (!task || task.status !== 'running') return;

    this.#registry.decrementLoad(task.assignedTo);
    this.emit('task:timeout', { ...task });
    await this.#handleFailure(task, 'Task timed out');
    this.#processQueue();
  }

  /**
   * Handle a failed task — retry or mark as permanently failed.
   * @private
   * @param {TaskRecord} task
   * @param {string} errorMessage
   */
  async #handleFailure(task, errorMessage) {
    task.retries += 1;

    if (task.retries <= task.maxRetries) {
      // Retry
      task.status = 'queued';
      task.assignedTo = null;
      task.startedAt = null;
      task.error = null;
      this.#queue.push(task);
      this.emit('task:retrying', { ...task, attempt: task.retries });
      await this.#blackboard.writeLog('task', `Task ${task.id} retrying (attempt ${task.retries}/${task.maxRetries}): ${errorMessage}`);
    } else {
      // Permanent failure
      task.status = 'failed';
      task.error = errorMessage;
      task.completedAt = new Date().toISOString();
      this.emit('task:failed', { ...task });
      await this.#blackboard.writeLog('task', `Task ${task.id} permanently failed: ${errorMessage}`);
    }
  }

  /**
   * Apply declarative agent restrictions before a dispatch strategy selects
   * the final candidate.
   * @private
   */
  #applyRoutingConstraints(candidates, routing) {
    if (!routing) return candidates;

    let routedCandidates = candidates;
    const routingType = (agent) => agent.metadata?.routing?.type || agent.type;
    const routingId = (agent) => agent.metadata?.routing?.id || agent.name;

    if (routing.restrictToAgentType) {
      routedCandidates = routedCandidates.filter(
        (agent) => routingType(agent) === routing.restrictToAgentType,
      );
    }

    const preferredIds = new Set(routing.preferredAgentIds || []);
    if (preferredIds.size > 0) {
      const preferred = routedCandidates.filter((agent) => preferredIds.has(routingId(agent)));
      if (preferred.length > 0) routedCandidates = preferred;
    }

    if (routing.preferAgentType) {
      const preferredType = routedCandidates.filter(
        (agent) => routingType(agent) === routing.preferAgentType,
      );
      if (preferredType.length > 0) routedCandidates = preferredType;
    }

    return routedCandidates;
  }

  /**
   * @private
   * @param {string} taskId
   */
  #clearTimeout(taskId) {
    const timer = this.#timeouts.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.#timeouts.delete(taskId);
    }
  }

  // ─── Query helpers ─────────────────────────────────────────────────

  /**
   * Get a task by ID.
   * @param {string} id
   * @returns {TaskRecord|undefined}
   */
  getTask(id) {
    const t = this.#tasks.get(id);
    return t ? { ...t } : undefined;
  }

  /**
   * List all tasks, optionally filtered by status.
   * @param {string} [status]
   * @returns {TaskRecord[]}
   */
  listTasks(status) {
    const all = [...this.#tasks.values()].map((t) => ({ ...t }));
    return status ? all.filter((t) => t.status === status) : all;
  }

  /**
   * Get queue depth.
   * @returns {number}
   */
  get queueSize() {
    return this.#queue.length;
  }

  /**
   * Get total number of tracked tasks.
   * @returns {number}
   */
  get totalTasks() {
    return this.#tasks.size;
  }
}
