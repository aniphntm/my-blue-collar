import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../server/store.mjs';
const env = { AUTH_REDIS_REST_URL: 'https://test.upstash.io', AUTH_REDIS_REST_TOKEN: 'test-only-token' };
test('durable store rejects missing or insecure configuration; never uses memory fallback', () => {
  for (const config of [{}, { ...env, AUTH_REDIS_REST_TOKEN: '' }, { ...env, AUTH_REDIS_REST_URL: 'http://test.upstash.io' }, { ...env, AUTH_REDIS_REST_URL: 'https://user@test.upstash.io' }, { ...env, AUTH_REDIS_REST_URL: 'https://test.upstash.io/path' }]) assert.throws(() => createStore(config));
});
test('store requests protect credentials, hash bearer identifiers, bound timeouts, and forbid redirects', async () => {
  const token = 'a'.repeat(64), calls = [];
  const store = createStore(env, async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ result: null }) }; });
  assert.equal(await store.get(token), null);
  const { url, options } = calls[0]; assert.equal(url, env.AUTH_REDIS_REST_URL); assert.equal(options.redirect, 'error'); assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.body.includes(token), false); assert.equal(options.body.includes(env.AUTH_REDIS_REST_TOKEN), false);
});
test('store transport failures and malformed replies fail closed', async () => {
  for (const fetchImpl of [async () => { throw new Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => ({ error: 'denied' }) }), async () => ({ ok: true, json: async () => ({}) }), async () => ({ ok: true, json: async () => ({ result: 'not-json' }) })]) await assert.rejects(createStore(env, fetchImpl).get('a'.repeat(64)));
});
