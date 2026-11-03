import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { makeHandler } from '../server/session.mjs';
import { env, run, req, memoryStore } from './helpers.mjs';
const source = await readFile(new URL('../src/wallet.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { createWalletConnection } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
function setup() {
  const account = privateKeyToAccount(generatePrivateKey()), store = memoryStore();
  const handler = makeHandler({ env, store }); const events = new Map(), methods = [], states = []; let cookie = '';
  const request = async (url, options) => {
    assert.equal(url, '/api/session');
    const response = await run(handler, req(options.method, options.body, cookie));
    if (response.headers['Set-Cookie']) { const value = response.headers['Set-Cookie']; cookie = (Array.isArray(value) ? value[0] : value).split(';')[0]; }
    return { ok: response.code === 200, json: async () => response.body };
  };
  const provider = {
    on(event, fn) { events.set(event, fn); }, removeListener(event) { events.delete(event); },
    async request({ method, params }) {
      methods.push(method);
      if (['eth_requestAccounts', 'eth_accounts'].includes(method)) return [account.address];
      if (method === 'eth_chainId') return '0x2105';
      if (method === 'personal_sign') return account.signMessage({ message: { raw: params[0] } });
      throw new Error('Unexpected wallet method');
    },
  };
  const controller = createWalletConnection(s => states.push(s), request);
  return { account, store, handler, provider, methods, events, states, controller, cookie: () => cookie };
}
test('browser connection is separate from real signature verification; no spending methods are requested', async () => {
  const s = setup(); await s.controller.connect(s.provider);
  assert.equal(s.states.at(-1).authenticated, false); assert.equal(s.states.at(-1).address, s.account.address);
  assert.equal(s.methods.includes('personal_sign'), false);
  await s.controller.verify(); assert.equal(s.states.at(-1).authenticated, true);
  assert.ok(s.methods.every(m => ['eth_accounts', 'eth_requestAccounts', 'eth_chainId', 'personal_sign'].includes(m)));
  const oldCookie = s.cookie(); await s.controller.forget();
  assert.equal((await run(s.handler, req('GET', undefined, oldCookie))).code, 401);
});
test('user-rejected signature clears the challenge and permits reconnect', async () => {
  const s = setup(), original = s.provider.request;
  s.provider.request = args => args.method === 'personal_sign' ? Promise.reject(new Error('User rejected signature')) : original(args);
  await s.controller.connect(s.provider); await s.controller.verify();
  assert.equal(s.states.at(-1).authenticated, false); assert.equal(s.store.records.size, 0);
  s.provider.request = original; await s.controller.connect(s.provider); assert.equal(s.states.at(-1).address, s.account.address);
  await s.controller.forget();
});
test('cancel during wallet prompt ignores late account selection', async () => {
  const s = setup(), original = s.provider.request; let resolve; let reached;
  const ready = new Promise(r => { reached = r; });
  s.provider.request = args => args.method === 'eth_requestAccounts' ? new Promise(r => { resolve = r; reached(); }) : original(args);
  const connect = s.controller.connect(s.provider); await ready; await s.controller.forget(); resolve([s.account.address]); await connect;
  assert.equal(s.states.at(-1).address, null); assert.equal(s.states.at(-1).authenticated, false);
});
test('account or chain changes revoke the server session and remove listeners', async () => {
  for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) {
    const s = setup(); await s.controller.connect(s.provider); await s.controller.verify();
    const cookie = s.cookie(); s.events.get(event)(); await new Promise(r => setTimeout(r, 10));
    assert.equal(s.states.at(-1).authenticated, false); assert.equal(s.events.size, 0);
    assert.equal((await run(s.handler, req('GET', undefined, cookie))).code, 401);
  }
});
test('cancel during signature prompt prevents later signature from authenticating', async () => {
  const s = setup(), original = s.provider.request; let resolve, reached;
  const ready = new Promise(r => { reached = r; });
  s.provider.request = args => args.method === 'personal_sign' ? new Promise(r => { resolve = async () => r(await original(args)); reached(); }) : original(args);
  await s.controller.connect(s.provider); const verifying = s.controller.verify(); await ready;
  await s.controller.forget(); await resolve(); await verifying;
  assert.equal(s.store.records.size, 0); assert.equal(s.states.at(-1).authenticated, false);
});
test('logout failure is reported truthfully instead of claiming server revocation', async () => {
  const states = []; const c = createWalletConnection(s => states.push(s), async () => { throw new Error('offline'); });
  await c.forget(); assert.match(states.at(-1).message, /Could not confirm server logout/);
});
