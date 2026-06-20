/**
 * @module index
 * @description Main entry point for the NEXUS AI Orchestrator.
 * Boots all subsystems, wires up adapters, starts the Express API on port 3001,
 * and exposes a WebSocket server for real-time dashboard updates.
 */

import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import { WebSocketServer } from 'ws';

// ─── Core modules ────────────────────────────────────────────────────
import { Blackboard } from './core/blackboard.js';
import { AgentRegistry } from './core/agent-registry.js';
import { TaskDispatcher } from './core/task-dispatcher.js';
import { HealthMonitor } from './core/health-monitor.js';
import { RoutingEngine } from './routing/routing-engine.js';

// ─── Adapters ────────────────────────────────────────────────────────
import { GeminiAdapter } from './adapters/gemini-adapter.js';
import { ClaudeAdapter } from './adapters/claude-adapter.js';
import { ChatGPTAdapter } from './adapters/chatgpt-adapter.js';
import { OllamaAdapter } from './adapters/ollama-adapter.js';

// ─── Strategies ──────────────────────────────────────────────────────
import { RoundRobinStrategy } from './strategies/round-robin.js';
import { CapabilityMatchStrategy } from './strategies/capability-match.js';
import { LoadBalanceStrategy } from './strategies/load-balance.js';

// ─── Constants ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);
const SHARED_WORKSPACE = process.env.SHARED_WORKSPACE
  || path.resolve(__dirname, '..', '..', 'shared-workspace');

// ─── ASCII banner ────────────────────────────────────────────────────
const BANNER = `
╔══════════════════════════════════════════════════════════╗
║             ⚡  NEXUS AI ORCHESTRATOR  ⚡                ║
║          Multi-Agent Coordination Engine                 ║
╚══════════════════════════════════════════════════════════╝`;

// ═════════════════════════════════════════════════════════════════════
//  BOOTSTRAP
// ═════════════════════════════════════════════════════════════════════

console.log(chalk.cyan(BANNER));
console.log(chalk.gray(`Workspace : ${SHARED_WORKSPACE}`));
console.log(chalk.gray(`Port      : ${PORT}`));
console.log();

// ─── 1. Instantiate core systems ─────────────────────────────────────

const blackboard = new Blackboard({ workspacePath: SHARED_WORKSPACE });
const registry = new AgentRegistry();
const routingEngine = new RoutingEngine();
const dispatcher = new TaskDispatcher({ registry, blackboard, routingEngine });
const healthMonitor = new HealthMonitor({ registry, blackboard }, {
  intervalMs: 30_000,
  maxFailures: 3,
  pingTimeoutMs: 10_000,
});

// ─── 2. Instantiate adapters ─────────────────────────────────────────

const adapters = {
  gemini: new GeminiAdapter(),
  claude: new ClaudeAdapter(),
  chatgpt: new ChatGPTAdapter({ workspacePath: SHARED_WORKSPACE }),
  ollama: new OllamaAdapter(),
};

const ROUTING_AGENT_IDS = {
  gemini: 'gemini-cli',
  claude: 'claude-code',
  chatgpt: 'chatgpt-desktop',
  ollama: 'ollama',
};
let routingConfig = null;

function buildAgentRegistration(type, adapter, status) {
  const routingId = ROUTING_AGENT_IDS[type] || adapter.name;
  const configuredAgent = routingConfig?.agents?.[routingId];

  return {
    name: adapter.name,
    type,
    capabilities: [
      ...new Set([
        ...adapter.capabilities,
        ...(configuredAgent?.capabilities || []),
      ]),
    ],
    maxConcurrent: configuredAgent?.limits?.max_concurrent_tasks
      ?? (type === 'ollama' ? 2 : 1),
    metadata: {
      ...status,
      routing: {
        id: routingId,
        type: configuredAgent?.type || type,
        priority: configuredAgent?.priority ?? null,
      },
    },
  };
}

// Register adapters with dispatcher and health monitor
for (const [type, adapter] of Object.entries(adapters)) {
  dispatcher.registerAdapter(type, adapter);
  healthMonitor.registerAdapter(type, adapter);
}

// ─── 3. Register strategies ──────────────────────────────────────────

const strategies = {
  'round-robin': new RoundRobinStrategy(),
  'capability-match': new CapabilityMatchStrategy(),
  'load-balance': new LoadBalanceStrategy(),
};

for (const [name, strategy] of Object.entries(strategies)) {
  dispatcher.addStrategy(name, strategy);
}

dispatcher.setDefaultStrategy('capability-match');

// ─── 4. Express + HTTP server ────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(chalk.gray(`${req.method} ${req.path}`));
  next();
});

// ─── 5. WebSocket server ─────────────────────────────────────────────

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
/** @type {Set<import('ws').WebSocket>} */
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(chalk.green(`⚡ Dashboard connected (${wsClients.size} client(s))`));

  // Send current state on connect
  ws.send(JSON.stringify({
    type: 'initial-state',
    data: {
      agents: registry.getAll(),
      tasks: dispatcher.listTasks(),
      health: healthMonitor.getSystemHealth(),
    },
  }));

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(chalk.yellow(`⚡ Dashboard disconnected (${wsClients.size} client(s))`));
  });

  ws.on('error', () => {
    wsClients.delete(ws);
  });
});

/**
 * Broadcast a message to all connected WebSocket clients.
 * @param {string} type
 * @param {Object} data
 */
function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of wsClients) {
    if (client.readyState === 1 /* OPEN */) {
      client.send(message);
    }
  }
}

// ─── 6. Wire events → WebSocket broadcasts ──────────────────────────

registry.on('agent:registered', (agent) => {
  console.log(chalk.green(`✓ Agent registered: ${agent.name} (${agent.type})`));
  broadcast('agent:registered', agent);
});

registry.on('agent:unregistered', (agent) => {
  console.log(chalk.red(`✗ Agent unregistered: ${agent.name}`));
  broadcast('agent:unregistered', agent);
});

registry.on('agent:updated', (agent) => {
  broadcast('agent:updated', agent);
});

dispatcher.on('task:queued', (task) => {
  console.log(chalk.blue(`📋 Task queued: ${task.id} (${task.type})`));
  broadcast('task:queued', task);
});

dispatcher.on('task:dispatched', (task) => {
  console.log(chalk.magenta(`🚀 Task dispatched: ${task.id} → ${task.assignedTo}`));
  broadcast('task:dispatched', task);
});

dispatcher.on('task:completed', (task) => {
  console.log(chalk.green(`✅ Task completed: ${task.id} by ${task.assignedTo}`));
  broadcast('task:completed', task);
});

dispatcher.on('task:failed', (task) => {
  console.log(chalk.red(`❌ Task failed: ${task.id} — ${task.error}`));
  broadcast('task:failed', task);
});

dispatcher.on('task:retrying', (task) => {
  console.log(chalk.yellow(`🔄 Task retrying: ${task.id} (attempt ${task.attempt})`));
  broadcast('task:retrying', task);
});

dispatcher.on('task:timeout', (task) => {
  console.log(chalk.red(`⏱️ Task timed out: ${task.id}`));
  broadcast('task:timeout', task);
});

healthMonitor.on('agent:unhealthy', (data) => {
  console.log(chalk.red(`💔 Agent unhealthy: ${data.agentName}`));
  broadcast('agent:unhealthy', data);
});

healthMonitor.on('agent:recovered', (data) => {
  console.log(chalk.green(`💚 Agent recovered: ${data.agentName}`));
  broadcast('agent:recovered', data);
});

healthMonitor.on('health:check', (report) => {
  broadcast('health:check', report);
});

blackboard.on('task:new', (task) => {
  console.log(chalk.cyan(`📥 New task file detected: ${task.id}`));
  // Auto-dispatch tasks that arrive via the filesystem
  dispatcher.submit(task);
});

blackboard.on('error', (err) => {
  console.error(chalk.red(`Blackboard error: ${err.message}`));
});

// ═════════════════════════════════════════════════════════════════════
//  REST API ROUTES
// ═════════════════════════════════════════════════════════════════════

/**
 * GET /api/agents
 * List all registered agents.
 */
app.get('/api/agents', (_req, res) => {
  res.json({
    success: true,
    data: registry.getAll(),
    total: registry.size,
  });
});

/**
 * POST /api/agents
 * Manually register a new agent.
 */
app.post('/api/agents', (req, res) => {
  try {
    const agent = registry.register(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/agents/:name
 * Unregister an agent.
 */
app.delete('/api/agents/:name', (req, res) => {
  const removed = registry.unregister(req.params.name);
  if (removed) {
    res.json({ success: true, message: `Agent "${req.params.name}" unregistered.` });
  } else {
    res.status(404).json({ success: false, error: 'Agent not found.' });
  }
});

/**
 * GET /api/tasks
 * List all tasks, optionally filtered by status.
 */
app.get('/api/tasks', (req, res) => {
  const { status } = req.query;
  const tasks = dispatcher.listTasks(status);
  res.json({
    success: true,
    data: tasks,
    total: tasks.length,
    queueSize: dispatcher.queueSize,
  });
});

/**
 * GET /api/tasks/:id
 * Get a specific task by ID.
 */
app.get('/api/tasks/:id', (req, res) => {
  const task = dispatcher.getTask(req.params.id);
  if (task) {
    res.json({ success: true, data: task });
  } else {
    res.status(404).json({ success: false, error: 'Task not found.' });
  }
});

/**
 * POST /api/tasks
 * Create and submit a new task.
 * Body: { type, prompt, context?, priority?, tags?, strategy?, timeoutMs?, maxRetries?, requiredCapabilities? }
 */
app.post('/api/tasks', async (req, res) => {
  try {
    const { type, prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: '"prompt" is required.' });
    }

    const task = dispatcher.submit({
      type: type || 'general',
      prompt,
      context: req.body.context,
      priority: req.body.priority,
      tags: req.body.tags,
      strategy: req.body.strategy,
      timeoutMs: req.body.timeoutMs,
      maxRetries: req.body.maxRetries,
      requiredCapabilities: req.body.requiredCapabilities,
    });

    // Also persist to blackboard inbox for auditability
    await blackboard.submitTask(task);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/health
 * System health report.
 */
app.get('/api/health', (_req, res) => {
  const health = healthMonitor.getSystemHealth();
  res.json({
    success: true,
    data: health,
  });
});

/**
 * GET /api/status
 * Overall orchestrator status.
 */
app.get('/api/status', async (_req, res) => {
  const agentStatuses = await blackboard.readAgentStatuses();
  const tasks = dispatcher.listTasks();
  const health = healthMonitor.getSystemHealth();

  const statusCounts = {
    pending: 0,
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };
  for (const t of tasks) {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status] += 1;
    }
  }

  res.json({
    success: true,
    data: {
      orchestrator: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        pid: process.pid,
      },
      agents: {
        total: registry.size,
        available: registry.getAvailable().length,
        details: registry.getAll(),
        fileStatuses: agentStatuses,
      },
      tasks: {
        total: tasks.length,
        queueSize: dispatcher.queueSize,
        byStatus: statusCounts,
      },
      health,
      strategies: Object.keys(strategies),
      adapters: Object.keys(adapters),
      workspace: SHARED_WORKSPACE,
    },
  });
});

/**
 * GET /api/adapters
 * List all adapter statuses.
 */
app.get('/api/adapters', async (_req, res) => {
  const statuses = {};
  for (const [name, adapter] of Object.entries(adapters)) {
    try {
      statuses[name] = await adapter.getStatus();
    } catch (err) {
      statuses[name] = { adapter: name, available: false, error: err.message };
    }
  }
  res.json({ success: true, data: statuses });
});

/**
 * POST /api/adapters/detect
 * Auto-detect which adapters are available and register them as agents.
 */
app.post('/api/adapters/detect', async (_req, res) => {
  const results = [];

  for (const [type, adapter] of Object.entries(adapters)) {
    try {
      const available = await adapter.isAvailable();
      if (available) {
        const agent = registry.register(buildAgentRegistration(
          type,
          adapter,
          await adapter.getStatus(),
        ));
        results.push({ type, status: 'registered', agent });
      } else {
        results.push({ type, status: 'unavailable' });
      }
    } catch (err) {
      results.push({ type, status: 'error', error: err.message });
    }
  }

  res.json({ success: true, data: results });
});

/**
 * GET /api/connection-check
 * Verify live connectivity to each AI adapter in parallel.
 * Returns per-adapter connected status, latency, and an overall summary.
 */
app.get('/api/connection-check', async (_req, res) => {
  const CHECK_TIMEOUT_MS = 15_000;

  const checks = await Promise.all(
    Object.entries(adapters).map(async ([name, adapter]) => {
      const startedAt = Date.now();
      try {
        const connected = await Promise.race([
          adapter.isAvailable(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT_MS),
          ),
        ]);
        return { adapter: name, connected, latencyMs: Date.now() - startedAt, error: null };
      } catch (err) {
        return { adapter: name, connected: false, latencyMs: Date.now() - startedAt, error: err.message };
      }
    }),
  );

  const connectedCount = checks.filter((c) => c.connected).length;
  const anyConnected = connectedCount > 0;

  res.status(anyConnected ? 200 : 503).json({
    success: anyConnected,
    summary: {
      total: checks.length,
      connected: connectedCount,
      disconnected: checks.length - connectedCount,
      status: connectedCount === checks.length ? 'all_connected' : anyConnected ? 'partial' : 'none_connected',
    },
    adapters: checks,
    checkedAt: new Date().toISOString(),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.',
    availableEndpoints: [
      'GET  /api/agents',
      'POST /api/agents',
      'DELETE /api/agents/:name',
      'GET  /api/tasks',
      'GET  /api/tasks/:id',
      'POST /api/tasks',
      'GET  /api/health',
      'GET  /api/status',
      'GET  /api/adapters',
      'POST /api/adapters/detect',
      'GET  /api/connection-check',
      'WS   /ws',
    ],
  });
});

// ─── Global error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(chalk.red(`API Error: ${err.message}`));
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ═════════════════════════════════════════════════════════════════════
//  STARTUP
// ═════════════════════════════════════════════════════════════════════

async function start() {
  try {
    // 1. Initialize the blackboard (creates dirs, starts watchers)
    console.log(chalk.gray('▸ Initializing blackboard…'));
    await blackboard.initialize();
    routingConfig = await blackboard.readConfig('routing-rules');
    if (routingConfig) {
      routingEngine.configure(routingConfig);
      if (strategies[routingEngine.defaultStrategy]) {
        dispatcher.setDefaultStrategy(routingEngine.defaultStrategy);
      }
      console.log(chalk.green('  Routing rules loaded'));
    } else {
      console.log(chalk.yellow('  Routing rules not found; using defaults'));
    }
    console.log(chalk.green('  ✓ Blackboard ready'));

    // 2. Auto-detect available adapters and register agents
    console.log(chalk.gray('▸ Detecting available AI agents…'));
    for (const [type, adapter] of Object.entries(adapters)) {
      try {
        const available = await adapter.isAvailable();
        if (available) {
          registry.register(buildAgentRegistration(
            type,
            adapter,
            await adapter.getStatus(),
          ));
          console.log(chalk.green(`  ✓ ${adapter.name} detected and registered`));
        } else {
          console.log(chalk.yellow(`  ○ ${adapter.name} not available`));
        }
      } catch (err) {
        console.log(chalk.red(`  ✗ ${adapter.name} error: ${err.message}`));
      }
    }

    // 3. Start health monitoring
    console.log(chalk.gray('▸ Starting health monitor…'));
    healthMonitor.start();
    console.log(chalk.green('  ✓ Health monitor running (30s interval)'));

    // 4. Start HTTP + WebSocket server
    httpServer.listen(PORT, () => {
      console.log();
      console.log(chalk.cyan.bold(`🌐 REST API : http://localhost:${PORT}/api`));
      console.log(chalk.cyan.bold(`🔌 WebSocket: ws://localhost:${PORT}/ws`));
      console.log();
      console.log(chalk.green.bold('NEXUS Orchestrator is operational. Waiting for tasks…'));
      console.log(chalk.gray('─'.repeat(58)));
    });
  } catch (err) {
    console.error(chalk.red(`Fatal startup error: ${err.message}`));
    console.error(err.stack);
    process.exit(1);
  }
}

// ─── Graceful shutdown ───────────────────────────────────────────────

async function shutdown(signal) {
  console.log(chalk.yellow(`\n${signal} received — shutting down gracefully…`));
  healthMonitor.stop();
  await blackboard.shutdown();
  httpServer.close();
  wss.close();
  console.log(chalk.green('✓ Shutdown complete.'));
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`Unhandled rejection: ${reason}`));
});

process.on('uncaughtException', (err) => {
  console.error(chalk.red(`Uncaught exception: ${err.message}`));
  console.error(err.stack);
  process.exit(1);
});

// Launch
start();
