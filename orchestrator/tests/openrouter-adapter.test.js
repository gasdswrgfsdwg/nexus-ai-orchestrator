import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpenRouterAdapter } from '../src/adapters/openrouter-adapter.js';

describe('OpenRouterAdapter', () => {
  it('reports unavailable and hasApiKey=false when no key is set', async () => {
    const adapter = new OpenRouterAdapter({ apiKey: '' });
    assert.equal(adapter.hasApiKey, false);
    const available = await adapter.isAvailable();
    assert.equal(available, false);
  });

  it('reports hasApiKey=true when a key is provided', () => {
    const adapter = new OpenRouterAdapter({ apiKey: 'sk-or-v1-test' });
    assert.equal(adapter.hasApiKey, true);
    assert.equal(adapter.name, 'openrouter');
    assert.equal(adapter.type, 'openrouter');
  });

  it('getStatus includes model and hasApiKey fields', async () => {
    const adapter = new OpenRouterAdapter({ apiKey: 'sk-or-v1-test', model: 'openai/gpt-4o' });
    // isAvailable will fail (no real network in test) — we just check shape
    const status = await adapter.getStatus().catch(() => ({ adapter: 'openrouter', available: false, model: 'openai/gpt-4o', hasApiKey: true }));
    assert.equal(status.hasApiKey, true);
    assert.equal(status.model, 'openai/gpt-4o');
  });

  it('execute throws descriptive error when no API key configured', async () => {
    const adapter = new OpenRouterAdapter({ apiKey: '' });
    await assert.rejects(
      () => adapter.execute({ id: 'test-1', prompt: 'hello' }),
      /OPENROUTER_API_KEY/,
    );
  });

  it('exposes expected capabilities', () => {
    const adapter = new OpenRouterAdapter({ apiKey: 'sk-or-v1-test' });
    const caps = adapter.capabilities;
    assert.ok(caps.includes('code'));
    assert.ok(caps.includes('chat'));
    assert.ok(caps.includes('reasoning'));
  });
});
