/**
 * Resolves declarative routing rules into dispatcher-ready task properties.
 */

const DEFAULT_STRATEGY = 'capability-match';
const DEFAULT_FALLBACK_STRATEGY = 'round-robin';
const DEFAULT_SUPPORTED_STRATEGIES = [
  'capability-match',
  'load-balance',
  'round-robin',
];

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function matchesExpected(actual, expected) {
  const expectedValues = asArray(expected);
  return expectedValues.length === 0 || expectedValues.includes(actual);
}

function matchesRule(condition = {}, task = {}) {
  if (condition.default) return false;

  const supportedKeys = new Set(['priority', 'task_type', 'tags']);
  const conditionKeys = Object.keys(condition);
  if (conditionKeys.some((key) => !supportedKeys.has(key))) return false;

  if (condition.priority !== undefined) {
    const priority = task.priority ?? task.context?.priority;
    if (!matchesExpected(priority, condition.priority)) return false;
  }

  if (condition.task_type !== undefined && !matchesExpected(task.type, condition.task_type)) {
    return false;
  }

  if (condition.tags !== undefined) {
    const taskTags = new Set([
      ...asArray(task.tags),
      ...asArray(task.context?.tags),
    ]);
    if (!asArray(condition.tags).some((tag) => taskTags.has(tag))) return false;
  }

  return conditionKeys.length > 0;
}

export class RoutingEngine {
  #config = {};
  #supportedStrategies;

  constructor(config = {}, options = {}) {
    this.#supportedStrategies = new Set(
      options.supportedStrategies || DEFAULT_SUPPORTED_STRATEGIES,
    );
    this.configure(config);
  }

  configure(config = {}) {
    if (config === null || typeof config !== 'object' || Array.isArray(config)) {
      throw new TypeError('Routing configuration must be an object.');
    }
    this.#config = config;
  }

  get defaultStrategy() {
    return this.#config.default_strategy || DEFAULT_STRATEGY;
  }

  get fallbackStrategy() {
    return this.#config.fallback_strategy || DEFAULT_FALLBACK_STRATEGY;
  }

  /**
   * Resolve all matching rules. The first match owns the strategy, while later
   * matches can add restrictions such as local-only execution.
   */
  resolve(taskInput = {}) {
    const rules = Array.isArray(this.#config.routing_rules)
      ? this.#config.routing_rules
      : [];
    const matchedRules = rules.filter((rule) => matchesRule(rule.condition, taskInput));
    const defaultRule = rules.find((rule) => rule.condition?.default === true);
    const appliedRules = matchedRules.length > 0
      ? matchedRules
      : (defaultRule ? [defaultRule] : []);

    const primaryAction = appliedRules[0]?.action || {};
    const combinedAction = appliedRules.reduce(
      (result, rule) => ({ ...result, ...rule.action }),
      {},
    );
    const taskTypeConfig = this.#config.task_types?.[taskInput.type] || {};
    const hasConfiguredTaskType = Boolean(this.#config.task_types?.[taskInput.type]);
    const requestedStrategy = taskInput.strategy
      || primaryAction.strategy
      || this.defaultStrategy;

    let strategy = requestedStrategy;
    let degraded = false;
    if (!taskInput.strategy && !this.#supportedStrategies.has(strategy)) {
      strategy = this.#supportedStrategies.has(this.defaultStrategy)
        ? this.defaultStrategy
        : this.fallbackStrategy;
      degraded = true;
    }

    return {
      ...taskInput,
      strategy,
      requiredCapabilities: taskInput.requiredCapabilities
        ?? (hasConfiguredTaskType ? [taskInput.type] : []),
      routing: {
        ruleNames: appliedRules.map((rule) => rule.name),
        requestedStrategy,
        degraded,
        preferredAgentIds: taskTypeConfig.preferred_agents || [],
        preferAgentType: combinedAction.prefer_type || null,
        restrictToAgentType: combinedAction.restrict_to_type || null,
        maxAgents: combinedAction.max_agents || 1,
        mergeResults: Boolean(combinedAction.merge_results),
      },
    };
  }
}
