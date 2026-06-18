/**
 * @module strategies/round-robin
 * @description Simple rotation strategy — cycles through available agents
 * in order, distributing tasks evenly regardless of load or capability.
 */

/**
 * RoundRobinStrategy — selects the next agent in a rotating sequence.
 */
export class RoundRobinStrategy {
  /** @type {number} Internal counter */
  #index = 0;

  /** @type {string} */
  get name() {
    return 'round-robin';
  }

  /**
   * Select the next agent in round-robin order.
   *
   * @param {import('../core/agent-registry.js').AgentInfo[]} agents - Available agents
   * @param {Object} _task - Task being dispatched (unused in this strategy)
   * @returns {import('../core/agent-registry.js').AgentInfo|null}
   */
  select(agents, _task) {
    if (!agents || agents.length === 0) return null;

    // Wrap index if agents list changed size
    this.#index = this.#index % agents.length;
    const chosen = agents[this.#index];
    this.#index = (this.#index + 1) % agents.length;

    return chosen;
  }

  /**
   * Reset the internal counter.
   */
  reset() {
    this.#index = 0;
  }
}
