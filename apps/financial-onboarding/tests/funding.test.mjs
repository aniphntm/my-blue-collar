import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { jwtVerify, generateKeyPair, SignJWT } from 'jose';
import { makeHandler, createCoinbaseJWT, validateCoinbaseUrl, readBalances, formatUnits, BASE_USDC } from '../server/funding.mjs';
import { userPath, verifyToken } from '../server/session.mjs';

const subject = 'did:privy:funding-user';
const address = '0x1234567890abcdef1234567890abcdef12345678';
const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const secret = ec.privateKey.export({ type: 'pkcs8', format: 'pem' });
const env = { PRIVY_APP_ID: 'app', PRIVY_APP_SECRET: 'privy-test-secret', CDP_API_KEY_ID: 'test-key', CDP_API_KEY_SECRET: secret };
const account = { type: 'wallet', chain_type: 'ethereum', wallet_client_type: 'privy', address };
const user = { id: subject, linked_accounts: [account] };
const launch = 'https://pay.coinbase.com/buy?sessionToken=test';
function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
function req(method = 'GET', extras = {}) { return { method, body: method === 'POST' ? { provider: 'coinbase' } : undefined, ...extras, headers: { host: 'onboard.mybluefinancial.com', origin: 'https://onboard.mybluefinancial.com', cookie: '__Secure-myblue-session=signed', ...extras.headers } }; }
function setup(options = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => url.includes('privy.io') ? (options.user ?? user) : { session: { onrampUrl: options.url ?? launch } } };
  };
  return { calls, handler: makeHandler({ env, verify: async () => ({ sub: subject }), fetchImpl, ...options }) };
}
async function run(handler, request) { const res = response(); await handler(request, res); return res; }

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

test('GET rejects anonymous, forged and expired sessions using real Privy signatures', async () => {
  process.env.PRIVY_APP_ID = 'app';
  const keys = await generateKeyPair('ES256');
  async function signed(exp = '1h', audience = 'app') { return new SignJWT({}).setProtectedHeader({ alg: 'ES256' }).setIssuer('privy.io').setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime(exp).sign(keys.privateKey); }
  const { handler, calls } = setup({ verify: token => verifyToken(token, keys.publicKey) });
  for (const cookie of ['', '__Secure-myblue-session=forged', `__Secure-myblue-session=${await signed(1)}`, `__Secure-myblue-session=${await signed('1h', 'other-app')}`]) {
    assert.equal((await run(handler, req('GET', { headers: { cookie } }))).code, 401);
  }
  assert.equal(calls.length, 0);
  assert.equal((await run(handler, req('GET', { headers: { cookie: `__Secure-myblue-session=${await signed()}` } }))).code, 200);
});

test('strict origins reject spoofed hosts, cross-origin GET/POST, absent POST origins and duplicate cookies', async () => {
  const { handler, calls } = setup();
  for (const method of ['GET', 'POST']) for (const headers of [
    { origin: 'https://evil.example' }, { host: 'evil.example', origin: 'https://evil.example' },
    { origin: 'https://onboard.mybluefinancial.com.evil.example' }, { origin: 'https://onboard.mybluefinancial.com:444' },
    { origin: 'https://mybluefinancial.com' },
  ]) assert.equal((await run(handler, req(method, { headers }))).code, 403);
  assert.equal((await run(handler, req('POST', { headers: { origin: undefined } }))).code, 403);
  assert.equal((await run(handler, req('GET', { headers: { origin: undefined, 'sec-fetch-site': 'cross-site' } }))).code, 403);
  assert.equal((await run(handler, req('GET', { headers: { cookie: '__Secure-myblue-session=a; __Secure-myblue-session=b' } }))).code, 401);
  assert.equal(calls.length, 0);
  assert.equal((await run(handler, req('GET', { headers: { origin: undefined, 'sec-fetch-site': 'same-origin' } }))).code, 200);
});

test('only explicitly configured HTTPS preview origins work', async () => {
  const headers = { host: 'preview.vercel.app', origin: 'https://preview.vercel.app' };
  assert.equal((await run(setup().handler, req('GET', { headers }))).code, 403);
  assert.equal((await run(setup({ env: { ...env, FUNDING_PREVIEW_ORIGIN: headers.origin } }).handler, req('GET', { headers }))).code, 200);
  assert.equal((await run(setup({ env: { ...env, FUNDING_PREVIEW_ORIGIN: `${headers.origin}/path` } }).handler, req('GET', { headers }))).code, 403);
});

test('GET returns only server-verified embedded wallet and truthful configured defaults', async () => {
  const { handler, calls } = setup(); const res = await run(handler, req());
  assert.equal(res.code, 200); assert.equal(res.body.wallet.address, address);
  assert.equal(res.body.providers.coinbase.available, true); assert.equal(res.body.providers.coinbase.mode, 'sandbox');
  assert.equal(res.body.asset, 'USDC'); assert.equal(res.body.network, 'base');
  assert.equal(calls[0].url, `https://api.privy.io/v1/users/${encodeURIComponent(subject)}`);
  assert.equal(calls[0].init.headers.Authorization, `Basic ${Buffer.from('app:privy-test-secret').toString('base64')}`);
  assert.equal(calls[0].init.headers['privy-app-id'], 'app');
  assert.equal(calls[0].init.redirect, 'error'); assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  for (const value of [subject, env.PRIVY_APP_SECRET, secret]) assert.equal(JSON.stringify(res.body).includes(value), false);
});

test('missing configuration never claims availability and cannot launch', async () => {
  for (const changed of [{ PRIVY_APP_SECRET: '' }, { CDP_API_KEY_ID: '' }, { CDP_API_KEY_SECRET: 'invalid' }, { COINBASE_ONRAMP_MODE: 'typo' }]) {
    const { handler } = setup({ env: { ...env, ...changed } });
    const res = await run(handler, req());
    assert.equal(res.code, 200); assert.equal(res.body.providers.coinbase.available, false);
    assert.equal((await run(handler, req('POST'))).code, 503);
  }
});

test('wallet identity and embedded nonzero EVM requirements fail closed', async () => {
  for (const changed of [{ type: 'email' }, { chain_type: 'solana' }, { wallet_client_type: 'metamask' }, { address: '0x' + '0'.repeat(40) }, { address: 'not-address' }]) {
    const { handler } = setup({ user: { ...user, linked_accounts: [{ ...account, ...changed }] } });
    const res = await run(handler, req());
    assert.equal(res.body.wallet, null); assert.equal(res.body.providers.coinbase.available, false);
    assert.equal((await run(handler, req('POST'))).code, 503);
  }
  assert.equal((await run(setup({ user: { ...user, id: 'other-user' } }).handler, req())).code, 502);
});

test('POST binds destination and callback to verified identity and signs exact Coinbase request', async () => {
  for (const mode of ['sandbox', 'production']) {
    const { handler, calls } = setup({ env: { ...env, COINBASE_ONRAMP_MODE: mode } });
    const res = await run(handler, req('POST'));
    assert.equal(res.code, 200); assert.equal(res.body.url, launch);
    assert.equal(calls.length, 2); assert.equal(calls[1].url, 'https://api.cdp.coinbase.com/platform/v2/onramp/sessions');
    assert.equal(calls[1].init.method, 'POST');
    const body = JSON.parse(calls[1].init.body);
    assert.deepEqual(body, { purchaseCurrency: 'USDC', destinationNetwork: 'base', destinationAddress: address,
      partnerUserRef: `${mode === 'sandbox' ? 'sandbox-' : ''}${userPath(subject)}`,
      redirectUrl: `https://onboard.mybluefinancial.com/${userPath(subject)}?provider=coinbase&funding=returned` });
    const jwt = calls[1].init.headers.Authorization.slice(7);
    await jwtVerify(jwt, ec.publicKey, { issuer: 'cdp', subject: 'test-key' });
    assert.equal(JSON.stringify(res.body).includes(jwt), false);
  }
});

test('malformed bodies and receiving-address overrides are rejected before upstream calls', async () => {
  const { handler, calls } = setup();
  for (const body of [undefined, null, [], '{', 'x'.repeat(1025), { provider: 'coinbase', destinationAddress: address }, { provider: 'coinbase', redirectUrl: 'https://evil.example' }]) {
    assert.equal((await run(handler, req('POST', { body }))).code, 400);
  }
  assert.equal(calls.length, 0);
  assert.equal((await run(handler, req('POST', { body: '{"provider":"coinbase"}' }))).code, 200);
});

test('provider URL allowlist rejects HTTP, lookalikes, credentials, ports and sandbox in production', async () => {
  for (const url of ['http://pay.coinbase.com', 'https://pay.coinbase.com.evil.example', 'https://pay.coinbase.com@evil.example', 'https://user@pay.coinbase.com', 'https://pay.coinbase.com:444', 'javascript:alert(1)', 'https://pay.coinbase.com/#secret', 'https://pay.coinbase.com/\\evil', ' https://pay.coinbase.com']) {
    assert.throws(() => validateCoinbaseUrl(url, 'sandbox'));
    assert.equal((await run(setup({ url }).handler, req('POST'))).code, 502);
  }
  assert.equal(validateCoinbaseUrl('https://pay-sandbox.coinbase.com/buy', 'sandbox'), 'https://pay-sandbox.coinbase.com/buy');
  assert.throws(() => validateCoinbaseUrl('https://pay-sandbox.coinbase.com/buy', 'production'));
});

test('upstream failure, malformed responses and stalled headers/bodies return generic errors', async () => {
  for (const fetchImpl of [async () => { throw new Error('secret details'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('private response'); } }), async () => new Promise(() => {}), async () => ({ ok: true, json: async () => new Promise(() => {}) })]) {
    const { handler } = setup({ fetchImpl, timeoutMs: 10 });
    const res = await run(handler, req('POST')); assert.equal(res.code, 502);
    assert.equal(JSON.stringify(res.body).includes('secret'), false);
  }
  const { handler } = setup({ fetchImpl: async url => url.includes('privy.io') ? { ok: true, json: async () => user } : { ok: true, json: async () => ({}) } });
  assert.equal((await run(handler, req('POST'))).code, 502);
});

test('unsupported methods advertise allowed methods without authentication or provider calls', async () => {
  const { handler, calls } = setup(); const res = await run(handler, req('DELETE'));
  assert.equal(res.code, 405); assert.equal(res.headers.Allow, 'GET, POST'); assert.equal(calls.length, 0);
});


test('Coinbase request failures and timeouts remain generic after successful wallet verification', async () => {
  for (const upstream of [async () => { throw new Error('secret provider response'); }, async () => ({ ok: false }), async () => new Promise(() => {}), async () => ({ ok: true, json: async () => new Promise(() => {}) })]) {
    const handler = setup({ timeoutMs: 10, fetchImpl: async (url, init) => url.includes('privy.io') ? { ok: true, json: async () => user } : upstream(url, init) }).handler;
    const res = await run(handler, req('POST'));
    assert.equal(res.code, 502);
    assert.deepEqual(res.body, { error: 'Unable to start Coinbase funding. Please try again.' });
  }
});

test('Robinhood is explicitly unavailable and authenticated POST never invents a launch contract', async () => {
  const { handler, calls } = setup();
  const context = await run(handler, req());
  assert.deepEqual(context.body.providers.robinhood, { available: false, mode: 'unavailable', reason: 'partner_setup_required' });
  calls.length = 0;
  assert.equal((await run(handler, req('POST', { body: { provider: 'robinhood' } }))).code, 503);
  assert.equal(calls.length, 0);
  assert.equal((await run(handler, req('POST', { body: { provider: 'robinhood' }, headers: { cookie: '' } }))).code, 401);
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

test('GET exposes observed balances only after verified Privy wallet lookup; POST does not query balances', async () => {
  const rpc = balanceFetch();
  const calls = [];
  const handler = setup({ env: { ...env, ALCHEMY_API_KEY: 'test-key' }, fetchImpl: async (url, init) => {
    calls.push(url);
    return url.includes('privy.io') ? { ok: true, json: async () => user } : url.includes('alchemy.com') ? rpc.fetchImpl(url, init)
      : { ok: true, json: async () => ({ session: { onrampUrl: launch } }) };
  } }).handler;
  const context = await run(handler, req());
  assert.equal(context.body.balances.available, true);
  assert.equal(calls[0].includes('privy.io'), true);
  assert.equal(JSON.stringify(context.body).includes('test-key'), false);
  calls.length = 0;
  await run(handler, req('POST'));
  assert.equal(calls.some(url => url.includes('alchemy.com')), false);
});
