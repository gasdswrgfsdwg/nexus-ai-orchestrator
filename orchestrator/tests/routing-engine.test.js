import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import test from 'node:test';

import { AgentRegistry } from '../src/core/agent-registry.js';
import { TaskDispatcher } from '../src/core/task-dispatcher.js';
import { RoutingEngine } from '../src/routing/routing-engine.js';
import { CapabilityMatchStrategy } from '../src/strategies/capability-match.js';
import { RoundRobinStrategy } from '../src/strategies/round-robin.js';

const configUrl = new URL('../../shared-workspace/_config/routing-rules.json', import.meta.url);

async function loadRoutingConfig() {
  return JSON.parse(await fs.readFile(configUrl, 'utf8'));
}

test('resolves task rules and keeps sensitive code local', async () => {
  const engine = new RoutingEngine(await loadRoutingConfig());
  const resolved = engine.resolve({
    type: 'code-generation',
    prompt: 'Implement feature',
    tags: ['confidential'],
  });

  assert.equal(resolved.strategy, 'capability-match');
  assert.deepEqual(resolved.routing.ruleNames, [
    'code-tasks-cloud-first',
    'privacy-sensitive-local',
  ]);
  assert.equal(resolved.routing.restrictToAgentType, 'local-api');
  assert.deepEqual(resolved.routing.preferredAgentIds, ['gemini-cli', 'claude-code']);
});

test('degrades unsupported configured parallel routing without hiding the decision', async () => {
  const engine = new RoutingEngine(await loadRoutingConfig());
  const resolved = engine.resolve({
    type: 'analysis',
    prompt: 'Compare options',
    priority: 'high',
  });

  assert.equal(resolved.strategy, 'capability-match');
  assert.equal(resolved.routing.requestedStrategy, 'parallel');
  assert.equal(resolved.routing.degraded, true);
  assert.equal(resolved.routing.maxAgents, 2);
});

test('uses the configured default rule when no specific rule matches', async () => {
  const engine = new RoutingEngine(await loadRoutingConfig());
  const resolved = engine.resolve({ type: 'general', prompt: 'Hello' });

  assert.equal(resolved.strategy, 'round-robin');
  assert.deepEqual(resolved.routing.ruleNames, ['fallback-to-any']);
  assert.deepEqual(resolved.requiredCapabilities, []);
});

test('dispatcher enforces local-only routing constraints', async () => {
  const engine = new RoutingEngine(await loadRoutingConfig());
  const registry = new AgentRegistry();
  const blackboard = {
    writeResult: async () => {},
    writeLog: async () => {},
  };
  const dispatcher = new TaskDispatcher({ registry, blackboard, routingEngine: engine });

  dispatcher.addStrategy('capability-match', new CapabilityMatchStrategy());
  dispatcher.addStrategy('round-robin', new RoundRobinStrategy());
  dispatcher.registerAdapter('gemini', { execute: async () => ({ output: 'cloud' }) });
  dispatcher.registerAdapter('ollama', { execute: async () => ({ output: 'local' }) });

  registry.register({
    name: 'gemini',
    type: 'gemini',
    capabilities: ['analysis'],
    metadata: { routing: { id: 'gemini-cli', type: 'cloud-cli' } },
  });
  registry.register({
    name: 'ollama',
    type: 'ollama',
    capabilities: ['analysis'],
    metadata: { routing: { id: 'ollama', type: 'local-api' } },
  });

  const completedEvent = once(dispatcher, 'task:completed');
  dispatcher.submit({ type: 'analysis', prompt: 'Private data', tags: ['private'] });
  const [completed] = await completedEvent;

  assert.equal(completed.assignedTo, 'ollama');
  assert.equal(completed.result.output, 'local');
});

test('submission is idempotent when a blackboard task repeats the same id', () => {
  const registry = new AgentRegistry();
  const blackboard = {
    writeResult: async () => {},
    writeLog: async () => {},
  };
  const dispatcher = new TaskDispatcher({ registry, blackboard });
  dispatcher.addStrategy('round-robin', new RoundRobinStrategy());

  const first = dispatcher.submit({ id: 'task-123', type: 'general', prompt: 'Once' });
  const repeated = dispatcher.submit({ id: 'task-123', type: 'general', prompt: 'Twice' });

  assert.equal(first.id, repeated.id);
  assert.equal(repeated.prompt, 'Once');
  assert.equal(dispatcher.totalTasks, 1);
  assert.equal(dispatcher.queueSize, 1);
});
