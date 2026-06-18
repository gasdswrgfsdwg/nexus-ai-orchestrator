/**
 * @module strategies/load-balance
 * @description Routes tasks to the agent with the lowest current load,
 * ensuring even distribution of work across the cluster.
 */

/**
 * LoadBalanceStrategy — selects the least-loaded agent that can handle the task.
 */
export class LoadBalanceStrategy {
  /** @type {string} */
  get name() {
    return 'load-balance';
  }

  /**
   * Select the agent with the lowest load ratio (currentLoad / maxConcurrent).
   * Ties are broken by best average response time.
   *
   * @param {import('../core/agent-registry.js').AgentInfo[]} agents
   * @param {Object} _task
   * @returns {import('../core/agent-registry.js').AgentInfo|null}
   */
  select(agents, _task) {
    if (!agents || agents.length === 0) return null;

    const scored = agents.map((agent) => {
      const loadRatio = agent.maxConcurrent > 0
        ? agent.currentLoad / agent.maxConcurrent
        : 1;
      const avgMs = agent.stats?.avgResponseMs ?? Infinity;

      return { agent, loadRatio, avgMs };
    });

    // Sort: lowest load ratio first, then fastest response time
    scored.sort((a, b) => {
      if (a.loadRatio !== b.loadRatio) return a.loadRatio - b.loadRatio;
      return a.avgMs - b.avgMs;
    });

    return scored[0].agent;
  }
}
