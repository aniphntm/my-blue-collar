import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/onboard.js', import.meta.url), 'utf8');
const address = '0x1234567890abcdef1234567890abcdef12345678';
function context(change = {}) {
  return { authenticated: true, wallet: { address, chainType: 'ethereum', walletClientType: 'privy' }, asset: 'USDC', network: 'base',
    providers: { coinbase: { available: true, mode: 'sandbox' }, robinhood: { available: false } },
    balances: { available: true, network: 'base', observedAt: '2026-10-15T12:00:00.000Z', native: { asset: 'ETH', amount: '0.000000000000000001' }, token: { asset: 'USDC', amount: '1.234567' } }, ...change };
}
async function page({ session = { authenticated: true, userPath: 'mine' }, funding = context(), search = '', pathname = '/mine', fundingOK = true, launch, launchOK = true } = {}) {
  const nodes = new Map(); const calls = []; const assigned = []; const replaced = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { hidden: true, disabled: false, textContent: '', events: {}, addEventListener(event, fn) { this.events[event] = fn; }, before(value) { this.beforeNode = value; } });
    return nodes.get(id);
  }
  const sandbox = { URL, URLSearchParams, console,
    document: { getElementById: node, querySelector: node, querySelectorAll: () => [node('provider')], createElement: () => ({}) },
    location: { search, pathname, hostname: 'onboard.mybluefinancial.com', assign: url => assigned.push(url), replace: url => replaced.push(url) },
    history: { replaceState: (...args) => replaced.push(args[2]) },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url === '/api/session') return { ok: true, json: async () => session };
      if (options.method === 'POST') return { ok: launchOK, json: async () => launch ?? ({ provider: 'coinbase', mode: 'sandbox', asset: 'USDC', network: 'base', url: 'https://pay-sandbox.coinbase.com/buy' }) };
      return { ok: fundingOK, json: async () => funding };
    },
  };
  vm.runInNewContext(source, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return { nodes, node, calls, assigned, replaced, click: async id => { await node(id).events.click?.(); } };
}

test('funding context is fetched only after authenticated session and canonical user path', async () => {
  for (const session of [{ authenticated: false }, null]) {
    const p = await page({ session });
    assert.deepEqual(p.calls.map(call => call.url), ['/api/session']);
    assert.equal(p.node('preview-provider').hidden, true);
  }
  const p = await page({ pathname: '/other' });
  assert.deepEqual(p.calls.map(call => call.url), ['/api/session']);
  assert.equal(p.replaced[0], 'https://onboard.mybluefinancial.com/mine?provider=coinbase');
});

test('destination, defaults and sandbox appear before launch; only explicit click POSTs provider', async () => {
  const p = await page();
  assert.equal(p.calls.length, 2);
  assert.match(p.node('funding-address').textContent, new RegExp(address));
  assert.equal(p.node('funding-destination').textContent, 'Receive USDC on Base');
  assert.match(p.node('funding-mode').textContent, /sandbox/);
  assert.match(p.node('preview-provider').textContent, /sandbox/);
  assert.match(p.node('balance-status').textContent, /1\.234567 USDC/);
  assert.match(p.node('balance-status').textContent, /0\.000000000000000001 ETH/);
  await p.click('preview-provider');
  assert.equal(p.calls[2].options.method, 'POST');
  assert.deepEqual(JSON.parse(p.calls[2].options.body), { provider: 'coinbase' });
  assert.equal(p.calls[2].options.credentials, 'same-origin');
  assert.deepEqual(p.assigned, ['https://pay-sandbox.coinbase.com/buy']);
});

test('unavailable options remain honest and keep fund-later; Robinhood can choose Coinbase', async () => {
  const p = await page({ search: '?provider=robinhood' });
  assert.match(p.node('setup-status').textContent, /Robinhood funding is not available yet/);
  assert.equal(p.node('preview-provider').hidden, true);
  assert.equal(p.node('coinbase-funding').hidden, false);
  await p.click('coinbase-funding');
  assert.equal(JSON.parse(p.calls[2].options.body).provider, 'coinbase');
  for (const funding of [context({ wallet: null }), context({ network: 'ethereum' }), context({ providers: { coinbase: { available: false } }, balances: { available: false } })]) {
    const p = await page({ funding });
    assert.equal(p.node('preview-provider').hidden, true);
    assert.equal(p.node('fund-later').hidden, false);
    await p.click('fund-later');
    assert.equal(p.assigned[0], 'https://mybluefinancial.com/create?provider=coinbase');
  }
  const failed = await page({ fundingOK: false });
  assert.equal(failed.node('fund-later').hidden, false);
  assert.match(failed.node('setup-status').textContent, /Unable to load/);
});

test('return is never completion even with observed balance; unavailable balance is not zero', async () => {
  const p = await page({ search: '?funding=returned' });
  assert.match(p.node('setup-status').textContent, /has not been confirmed/);
  assert.match(p.node('balance-status').textContent, /do not confirm/);
  const missing = await page({ funding: context({ balances: { available: false } }) });
  assert.match(missing.node('balance-status').textContent, /unavailable/);
  assert.doesNotMatch(missing.node('balance-status').textContent, /0 USDC/);
  const malformed = await page({ funding: context({ balances: { ...context().balances, observedAt: 'invalid' } }) });
  assert.match(malformed.node('balance-status').textContent, /unavailable/);
});

test('client refuses malicious URLs, mode/default mismatches, and launch failure while permitting retry', async () => {
  const valid = { provider: 'coinbase', mode: 'sandbox', asset: 'USDC', network: 'base', url: 'https://pay.coinbase.com/buy' };
  const invalid = ['http://pay.coinbase.com', 'https://pay.coinbase.com.evil.test', 'https://user@pay.coinbase.com', 'https://pay.coinbase.com:444', 'javascript:alert(1)', 'https://pay.coinbase.com/#fragment', ' https://pay.coinbase.com', 'https://pay.coinbase.com/\\evil'];
  for (const launch of [...invalid.map(url => ({ ...valid, url })), { ...valid, mode: 'production' }, { ...valid, network: 'ethereum' }, { ...valid, provider: 'robinhood' }]) {
    const p = await page({ launch }); await p.click('preview-provider');
    assert.equal(p.assigned.length, 0); assert.equal(p.node('preview-provider').disabled, false);
    assert.match(p.node('setup-status').textContent, /Unable to start/);
  }
  const failed = await page({ launchOK: false }); await failed.click('preview-provider');
  assert.equal(failed.assigned.length, 0);
  const prod = await page({ funding: context({ providers: { coinbase: { available: true, mode: 'production' } } }), launch: { ...valid, mode: 'production', url: 'https://pay-sandbox.coinbase.com' } });
  await prod.click('preview-provider'); assert.equal(prod.assigned.length, 0);
});

test('WalletConnect retains management flow without initiating provider funding', async () => {
  const p = await page({ search: '?provider=walletconnect' });
  assert.equal(p.node('preview-provider').textContent, 'Manage my wallet →');
  await p.click('preview-provider');
  assert.equal(p.assigned[0], 'https://mybluefinancial.com/create?provider=walletconnect');
  assert.equal(p.calls.length, 2);
});
