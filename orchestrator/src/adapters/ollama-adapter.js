/**
 * @module adapters/ollama-adapter
 * @description Adapter for Ollama — makes HTTP requests to the Ollama REST API
 * running on localhost:11434.
 */

/**
 * @typedef {Object} OllamaAdapterOptions
 * @property {string} [baseUrl='http://localhost:11434'] - Ollama API base URL
 * @property {string} [model='llama3']                   - Default model
 * @property {number} [timeoutMs=120000]                 - Request timeout
 */

/**
 * OllamaAdapter — communicates with a local Ollama instance via HTTP.
 * Implements: { name, type, isAvailable(), execute(task), getStatus() }
 */
export class OllamaAdapter {
  /** @type {string} */
  #baseUrl;
  /** @type {string} */
  #model;
  /** @type {number} */
  #timeoutMs;

  /**
   * @param {OllamaAdapterOptions} [options]
   */
  constructor(options = {}) {
    this.#baseUrl = (options.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
    this.#model = options.model || 'llama3';
    this.#timeoutMs = options.timeoutMs || 120_000;
  }

  /** @returns {string} */
  get name() {
    return 'ollama';
  }

  /** @returns {string} */
  get type() {
    return 'ollama';
  }

  /** @returns {string[]} */
  get capabilities() {
    return ['code', 'chat', 'analysis', 'creative'];
  }

  /**
   * Check whether the Ollama server is running and responsive.
   * Hits the GET / endpoint which returns "Ollama is running".
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.#baseUrl}/`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Execute a task using the Ollama generate API.
   *
   * @param {Object} task
   * @param {string} task.id
   * @param {string} task.prompt
   * @param {Object} [task.context]
   * @returns {Promise<Object>}
   */
  async execute(task) {
    let fullPrompt = task.prompt;
    if (task.context && Object.keys(task.context).length > 0) {
      fullPrompt = `Context:\n${JSON.stringify(task.context, null, 2)}\n\nTask:\n${task.prompt}`;
    }

    const start = Date.now();

    const response = await fetch(`${this.#baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.#model,
        prompt: fullPrompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(this.#timeoutMs),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown error');
      throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const durationMs = Date.now() - start;

    return {
      output: data.response || '',
      model: data.model || this.#model,
      durationMs,
      adapter: this.name,
      tokenCount: data.eval_count || null,
      totalDuration: data.total_duration || null,
    };
  }

  /**
   * Return current adapter status including available models.
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const available = await this.isAvailable();

    let models = [];
    if (available) {
      try {
        const response = await fetch(`${this.#baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          const data = await response.json();
          models = (data.models || []).map((m) => m.name);
        }
      } catch {
        // non-critical
      }
    }

    return {
      adapter: this.name,
      available,
      baseUrl: this.#baseUrl,
      model: this.#model,
      availableModels: models,
    };
  }

  /**
   * List all models available on the Ollama server.
   * @returns {Promise<string[]>}
   */
  async listModels() {
    try {
      const response = await fetch(`${this.#baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m) => m.name);
    } catch {
      return [];
    }
  }
}
