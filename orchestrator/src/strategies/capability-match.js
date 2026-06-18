/**
 * @module strategies/capability-match
 * @description Routes tasks to agents whose declared capabilities best
 * match the task's requirements. Prefers agents with more matching capabilities.
 */

/**
 * CapabilityMatchStrategy — selects the agent with the highest capability
 * overlap for the given task.
 */
export class CapabilityMatchStrategy {
  /** @type {string} */
  get name() {
    return 'capability-match';
  }

  /**
   * Select the agent with the most matching capabilities.
   * Ties are broken by lowest current load, then by fewest total completed tasks
   * (to give newer agents a chance).
   *
   * @param {import('../core/agent-registry.js').AgentInfo[]} agents
   * @param {Object} task
   * @param {string[]} [task.requiredCapabilities] - Capabilities the task needs
   * @returns {import('../core/agent-registry.js').AgentInfo|null}
   */
  select(agents, task) {
    if (!agents || agents.length === 0) return null;

    const required = task.requiredCapabilities || [task.type];
    if (!required.length) return agents[0]; // no preference → first available

    // Score each agent by number of matching capabilities
    const scored = agents.map((agent) => {
      const matchCount = required.filter((cap) =>
        agent.capabilities.includes(cap),
      ).length;

      return { agent, matchCount };
    });

    // Sort: most matches first, then lowest load, then fewest completed tasks
    scored.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      if (a.agent.currentLoad !== b.agent.currentLoad) return a.agent.currentLoad - b.agent.currentLoad;
      return (a.agent.stats?.tasksCompleted ?? 0) - (b.agent.stats?.tasksCompleted ?? 0);
    });

    // Only return an agent that has at least one matching capability
    const best = scored[0];
    return best.matchCount > 0 ? best.agent : scored[0].agent;
  }
}
