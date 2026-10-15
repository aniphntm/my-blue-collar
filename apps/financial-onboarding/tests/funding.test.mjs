import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { jwtVerify } from 'jose';
import { makeHandler, createCoinbaseJWT, validateCoinbaseUrl, readBalances, formatUnits, BASE_USDC } from '../server/funding.mjs';
import { getAddress } from 'viem';
import { COOKIE } from '../server/session.mjs';
import { env, origin, req, run, memoryStore } from './helpers.mjs';
const address = getAddress('0x1234567890abcdef1234567890abcdef12345678');
const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const secret = ec.privateKey.export({ type: 'pkcs8', format: 'pem' });
test('CDP signs real ES256 and 64-byte Ed25519 keys with bounded, URI-bound JWTs', async () => {
  const ed = generateKeyPairSync('ed25519');
  const jwk = ed.privateKey.export({ format: 'jwk' });
  const edSecret = Buffer.concat([Buffer.from(jwk.d, 'base64url'), Buffer.from(jwk.x, 'base64url')]).toString('base64');
  for (const [value, publicKey, alg] of [[secret, ec.publicKey, 'ES256'], [edSecret, ed.publicKey, 'EdDSA']]) {
    const now = Math.floor(Date.now() / 1000);
    const first = await createCoinbaseJWT('key-id', value, now);
    const { payload, protectedHeader } = await jwtVerify(first, publicKey, { issuer: 'cdp', subject: 'key-id', algorithms: [alg] });
    assert.equal(payload.nbf, now); assert.equal(payload.exp, now + 120);
    assert.deepEqual(payload.uris, ['POST api.cdp.coinbase.com/platform/v2/onramp/sessions']);
    assert.equal(protectedHeader.kid, 'key-id'); assert.match(protectedHeader.nonce, /^[a-f0-9]{32}$/);
    const second = await createCoinbaseJWT('key-id', value, now);
    assert.notEqual(first, second);
  }
  await assert.rejects(createCoinbaseJWT('id', Buffer.alloc(64).toString('base64')));
  await assert.rejects(createCoinbaseJWT('id', 'not-a-key'));
});

function balanceFetch(change = value => value) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const request = JSON.parse(init.body); calls.push({ url, init, request });
    const result = request.method === 'eth_getBalance' ? '0xde0b6b3a7640001'
      : { address, tokenBalances: [{ contractAddress: BASE_USDC, tokenBalance: '0x12d687' }] };
    return { ok: true, json: async () => change({ jsonrpc: '2.0', id: request.id, result }, request) };
  };
  return { fetchImpl, calls };
}

test('Alchemy reads fixed Base network and official USDC for verified wallet, preserving exact units', async () => {
  const { fetchImpl, calls } = balanceFetch();
  const balances = await readBalances({ address }, { ALCHEMY_API_KEY: 'test-key' }, fetchImpl);
  assert.equal(balances.available, true);
  assert.equal(balances.native.amount, '1.000000000000000001');
  assert.equal(balances.token.amount, '1.234567');
  assert.ok(Number.isFinite(Date.parse(balances.observedAt)));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call.request.params), [[address, 'latest'], [address, [BASE_USDC]]]);
  for (const call of calls) {
    assert.equal(call.url, 'https://base-mainnet.g.alchemy.com/v2/test-key');
    assert.equal(call.init.redirect, 'error');
    assert.ok(call.init.signal instanceof AbortSignal);
  }
  assert.equal(formatUnits('0x0', 6), '0');
  assert.equal(formatUnits('0x1', 6), '0.000001');
  assert.equal(formatUnits('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 18),
    '115792089237316195423570985008687907853269984665640564039457.584007913129639935');
  for (const value of [null, '0x', '-1', '1', '0xGG', '0x' + 'f'.repeat(65)]) assert.throws(() => formatUnits(value, 6));
});

test('missing configuration, wrong identity/contract, token errors and failed RPCs never become zero', async () => {
  const wallet = { address };
  const keyEnv = { ALCHEMY_API_KEY: 'key' };
  let calls = 0;
  for (const [value, config] of [[null, keyEnv], [wallet, {}], [wallet, { ALCHEMY_API_KEY: '../evil?key' }]]) {
    assert.equal((await readBalances(value, config, () => { calls++; })).available, false);
  }
  assert.equal(calls, 0);
  const modifiers = [
    data => ({ ...data, id: 99 }), data => ({ ...data, jsonrpc: '1.0' }), data => ({ ...data, error: { message: 'private details' } }),
    data => ({ ...data, result: null }),
    (data, req) => req.id === 2 ? { ...data, result: { ...data.result, address: '0x' + '0'.repeat(40) } } : data,
    (data, req) => req.id === 2 ? { ...data, result: { ...data.result, tokenBalances: [] } } : data,
    ...[{ contractAddress: address }, { error: 'token failure' }, { tokenBalance: null }, { tokenBalance: '0xGG' }].map(change =>
      (data, req) => req.id === 2 ? { ...data, result: { ...data.result, tokenBalances: [{ ...data.result.tokenBalances[0], ...change }] } } : data),
  ];
  for (const change of modifiers) {
    assert.deepEqual(await readBalances(wallet, keyEnv, balanceFetch(change).fetchImpl), { available: false, network: 'base', reason: 'upstream_unavailable' });
  }
  for (const fetchImpl of [async () => { throw new Error('private key'); }, async () => ({ ok: false }), async () => new Promise(() => {}), async () => ({ ok: true, json: async () => new Promise(() => {}) })]) {
    assert.deepEqual(await readBalances(wallet, keyEnv, fetchImpl, 5), { available: false, network: 'base', reason: 'upstream_unavailable' });
  }
});


async function setup() {
  const store = memoryStore(); const token = 'a'.repeat(64);
  await store.put(token, { kind: 'session', address, chainId: 8453, origin, expiresAt: Date.now() + 60000 });
  return { store, cookie: `${COOKIE}=${token}`, handler: makeHandler({ env: { ...env, CDP_API_KEY_ID: 'configured', CDP_API_KEY_SECRET: secret, COINBASE_ONRAMP_MODE: 'production', FUNDING_ENABLED: 'true' }, store }) };
}
test('funding uses only the server session destination and cannot launch even with credentials or enable flags', async () => {
  const s = await setup(); const context = await run(s.handler, req('GET', undefined, s.cookie));
  assert.equal(context.code, 200); assert.equal(context.body.wallet.address, address);
  assert.equal(context.body.providers.coinbase.available, false);
  for (const provider of ['coinbase', 'robinhood']) assert.equal((await run(s.handler, req('POST', { provider }, s.cookie))).code, 503);
});
test('unverified, expired, revoked and wrong-origin session records never supply a funding destination', async () => {
  const s = await setup(); const token = s.cookie.split('=')[1]; const original = await s.store.get(token);
  for (const value of [{ ...original, kind: 'challenge' }, { ...original, expiresAt: 0 }, { ...original, origin: 'https://evil.example' }, { ...original, chainId: 1 }, { ...original, address: 'not-a-wallet' }]) {
    await s.store.put(token, value);
    for (const method of ['GET', 'POST']) { const res = await run(s.handler, req(method, { provider: 'coinbase' }, s.cookie)); assert.equal(res.code, 401); assert.equal(res.body.wallet, undefined); }
  }
  await s.store.remove(token); assert.equal((await run(s.handler, req('GET', undefined, s.cookie))).code, 401);
});
test('funding rejects destination/callback overrides and cross-origin requests', async () => {
  const s = await setup();
  for (const body of [null, [], '{', { provider: 'coinbase', destinationAddress: address }, { provider: 'coinbase', redirectUrl: 'https://evil.example' }, { provider: 'unknown' }]) assert.equal((await run(s.handler, req('POST', body, s.cookie))).code, 400);
  assert.equal((await run(s.handler, req('POST', { provider: 'coinbase' }, s.cookie, { origin: 'https://evil.example' }))).code, 403);
  assert.equal((await run(s.handler, req('DELETE', undefined, s.cookie))).code, 405);
});
test('provider URL validation retains HTTPS allowlist and environment boundary', () => {
  for (const url of ['http://pay.coinbase.com', 'https://pay.coinbase.com.evil.example', 'https://user@pay.coinbase.com', 'https://pay.coinbase.com:444', 'https://pay.coinbase.com/#secret', ' https://pay.coinbase.com']) assert.throws(() => validateCoinbaseUrl(url, 'sandbox'));
  assert.equal(validateCoinbaseUrl('https://pay-sandbox.coinbase.com/buy', 'sandbox'), 'https://pay-sandbox.coinbase.com/buy');
  assert.throws(() => validateCoinbaseUrl('https://pay-sandbox.coinbase.com/buy', 'production'));
});
