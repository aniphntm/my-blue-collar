import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { parseSiweMessage } from 'viem/siwe';
import { makeHandler, COOKIE, CHALLENGE_SECONDS, SESSION_SECONDS } from '../server/session.mjs';
import { env, origin, req, run, memoryStore } from './helpers.mjs';
const account = privateKeyToAccount(generatePrivateKey());
const other = privateKeyToAccount(generatePrivateKey());
function setup() {
  let time = Date.now(); const store = memoryStore();
  const handler = makeHandler({ env, store, now: () => time });
  return { store, handler, advance(ms) { time += ms; } };
}
async function challenge(s) {
  const res = await run(s.handler, req('POST', { action: 'challenge', address: account.address, chainId: 8453 }));
  assert.equal(res.code, 200);
  return { cookie: res.headers['Set-Cookie'].split(';')[0], message: res.body.message, res };
}
async function verify(s, c, signer = account, message = c.message) { return run(s.handler, req('POST', { action: 'verify', signature: await signer.signMessage({ message }) }, c.cookie)); }

test('real SIWE signature authenticates only its wallet, Base chain and exact origin; cookie is host-only', async () => {
  const s = setup(), c = await challenge(s), parsed = parseSiweMessage(c.message);
  assert.equal(parsed.address, account.address); assert.equal(parsed.chainId, 8453);
  assert.equal(parsed.domain, 'mybluefinancial.com'); assert.equal(parsed.uri, `${origin}/wallet`);
  assert.equal(+parsed.expirationTime - +parsed.issuedAt, CHALLENGE_SECONDS * 1000);
  assert.match(parsed.nonce, /^[a-f0-9]{32}$/);
  assert.match(c.res.headers['Set-Cookie'], /^__Host-myblue-session=[a-f0-9]{64}; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600$/);
  assert.equal((await run(s.handler, req('GET', undefined, c.cookie))).code, 401);
  const result = await verify(s, c); assert.equal(result.code, 200); assert.equal(result.headers['Set-Cookie'], undefined);
  const session = await run(s.handler, req('GET', undefined, c.cookie));
  assert.equal(session.body.wallet.address, account.address); assert.equal(session.body.wallet.chainId, 8453);
  assert.equal(session.headers['Cache-Control'], 'no-store'); assert.equal(JSON.stringify(session.body).includes(c.cookie.split('=')[1]), false);
});
test('wrong signer and modified domain, URI, chain, nonce, expiration or statement do not authenticate', async () => {
  const s = setup(), c = await challenge(s);
  assert.equal((await verify(s, c, other)).code, 401);
  for (const message of [c.message.replace('mybluefinancial.com', 'evil.example'), c.message.replace('/wallet', '/other'), c.message.replace('8453', '1'), c.message.replace('Nonce: ', 'Nonce: a'), c.message.replace('Expiration Time:', 'Not Before:'), c.message.replace('Sign in to', 'Approve')]) assert.equal((await verify(s, c, account, message)).code, 401);
  assert.equal((await run(s.handler, req('GET', undefined, c.cookie))).code, 401);
});
test('challenge replay and concurrent verification have at most one winner', async () => {
  const s = setup(), c = await challenge(s);
  const results = await Promise.all([verify(s, c), verify(s, c)]);
  assert.deepEqual(results.map(x => x.code).sort(), [200, 401]);
  assert.equal((await verify(s, c)).code, 401);
});
test('signature cannot be used in another browser challenge', async () => {
  const s = setup(), c = await challenge(s), d = await challenge(s);
  assert.equal((await verify(s, d, account, c.message)).code, 401);
  assert.equal((await verify(s, { ...c, cookie: '' })).code, 401);
});
test('expiry is enforced in server code even if expired records remain in storage; fresh proof recovers access', async () => {
  const s = setup(), c = await challenge(s); s.advance(CHALLENGE_SECONDS * 1000);
  assert.equal((await verify(s, c)).code, 401);
  const d = await challenge(s); assert.equal((await verify(s, d)).code, 200);
  s.advance(SESSION_SECONDS * 1000); assert.equal((await run(s.handler, req('GET', undefined, d.cookie))).code, 401);
  const e = await challenge(s); assert.equal((await verify(s, e)).body.wallet.address, account.address);
});
test('cancel invalidates pending proof; logout invalidates a copied cookie on every worker', async () => {
  const s = setup(), c = await challenge(s);
  assert.equal((await run(s.handler, req('DELETE', undefined, c.cookie))).code, 200);
  assert.equal((await verify(s, c)).code, 401);
  const d = await challenge(s); await verify(s, d);
  const logout = await run(s.handler, req('DELETE', undefined, d.cookie));
  assert.ok(logout.headers['Set-Cookie'].every(v => v.includes('Max-Age=0')));
  const worker = makeHandler({ env, store: s.store });
  assert.equal((await run(worker, req('GET', undefined, d.cookie))).code, 401);
});
test('cancellation racing signature verification cannot resurrect a deleted challenge', async () => {
  const s = setup(), c = await challenge(s), original = s.store.replace;
  s.store.replace = async (...args) => { await s.store.remove(args[0]); return original(...args); };
  assert.equal((await verify(s, c)).code, 401);
  assert.equal((await run(s.handler, req('GET', undefined, c.cookie))).code, 401);
});
test('new challenge revokes the previous authenticated identity', async () => {
  const s = setup(), c = await challenge(s); await verify(s, c);
  const fresh = await run(s.handler, req('POST', { action: 'challenge', address: other.address, chainId: 8453 }, c.cookie));
  assert.equal(fresh.code, 200); assert.equal((await run(s.handler, req('GET', undefined, c.cookie))).code, 401);
});
test('cross-origin, subdomain, absent write origin, unconfigured preview and spoofed host are denied', async () => {
  const s = setup();
  for (const headers of [{ origin: 'https://evil.example' }, { origin: undefined }, { host: 'evil.example' }, { origin: 'https://onboard.mybluefinancial.com' }, { 'sec-fetch-site': 'same-site' }, { 'sec-fetch-site': 'cross-site' }]) assert.equal((await run(s.handler, req('POST', { action: 'challenge', address: account.address, chainId: 8453 }, '', headers))).code, 403);
  assert.equal((await run(s.handler, req('GET', undefined, '', { host: 'preview.vercel.app', origin: 'https://preview.vercel.app' }))).code, 403);
});
test('anonymous, forged, legacy and duplicate cookies cannot authorize', async () => {
  const s = setup(), c = await challenge(s); await verify(s, c);
  for (const cookie of ['', `${COOKIE}=fake`, `${COOKIE}=${'0'.repeat(64)}`, '__Secure-myblue-session=old-token', `${c.cookie}; ${c.cookie}`]) assert.equal((await run(s.handler, req('GET', undefined, cookie))).code, 401);
});
test('request validation rejects zero address, wrong chain, body overrides, missing JSON and malformed signatures', async () => {
  const s = setup();
  for (const body of [null, [], '{', 'x'.repeat(2049), { action: 'challenge', address: '0x'+'0'.repeat(40), chainId: 8453 }, { action: 'challenge', address: account.address, chainId: 1 }, { action: 'challenge', address: account.address, chainId: 8453, origin: origin }, { action: 'verify', signature: 'forged' }, { action: 'verify', signature: '0x'+'a'.repeat(130), address: account.address }]) assert.equal((await run(s.handler, req('POST', body))).code, 400);
  assert.equal((await run(s.handler, req('POST', {}, '', { 'content-type': 'text/plain' }))).code, 400);
  assert.equal((await run(s.handler, req('PATCH'))).code, 405);
});
test('missing configuration, unavailable store, and challenge rate cap fail closed without leaking details', async () => {
  assert.equal((await run(makeHandler({ env: {} }), req())).code, 503);
  assert.equal((await run(makeHandler({ env }), req())).code, 503);
  const s = setup(); s.store.allow = async () => false;
  const request = req('POST', { action: 'challenge', address: account.address, chainId: 8453 });
  assert.equal((await run(s.handler, request)).code, 429);
  s.store.allow = async () => { throw new Error('secret credentials'); };
  const result = await run(s.handler, request); assert.equal(result.code, 503); assert.equal(JSON.stringify(result.body).includes('credentials'), false);
});
