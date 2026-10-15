import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { makeHandler, verifyToken, userPath } from '../server/session.mjs';

process.env.PRIVY_APP_ID = 'test-myblue-app';
const { privateKey, publicKey } = await generateKeyPair('ES256');
const subject = 'did:privy:test-user';
async function token(options = {}) {
  return new SignJWT({}).setProtectedHeader({ alg: 'ES256' }).setSubject(subject)
    .setIssuer(options.issuer || 'privy.io').setAudience(options.audience || 'test-myblue-app')
    .setIssuedAt().setExpirationTime(options.expiration || '1h').sign(privateKey);
}
function response() {
  return { headers: {}, code: 200, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } };
}
const handler = makeHandler(value => verifyToken(value, publicKey));
const headers = { host: 'mybluefinancial.com', origin: 'https://mybluefinancial.com' };

test('verifies a real signature and rejects expired, wrong-app, wrong-issuer, and forged tokens', async () => {
  assert.equal((await verifyToken(await token(), publicKey)).sub, subject);
  for (const options of [{ audience: 'other-app' }, { issuer: 'attacker' }, { expiration: Math.floor(Date.now() / 1000) - 1 }]) {
    await assert.rejects(verifyToken(await token(options), publicKey));
  }
  await assert.rejects(verifyToken('forged.token.value', publicKey));
});
test('session handoff uses a verified, bounded secure cookie and opaque user path', async () => {
  const accessToken = await token(); const res = response();
  await handler({ method: 'POST', headers: { ...headers, authorization: `Bearer ${accessToken}` } }, res);
  assert.equal(res.code, 200); assert.equal(res.body.userPath, userPath(subject));
  assert.match(res.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Lax; Domain=mybluefinancial.com; Max-Age=\d+/);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  const onboard = response();
  await handler({ method: 'GET', headers: { host: 'onboard.mybluefinancial.com', cookie: `__Secure-myblue-session=${accessToken}` } }, onboard);
  assert.equal(onboard.body.authenticated, true);
  assert.equal(onboard.body.userPath, res.body.userPath);
  assert.equal(JSON.stringify(onboard.body).includes(accessToken), false);
});
test('rejects anonymous sessions, forged cookies, and cross-origin writes', async () => {
  for (const req of [
    { method: 'GET', headers },
    { method: 'GET', headers: { ...headers, cookie: '__Secure-myblue-session=fake' } },
    { method: 'POST', headers: { ...headers, origin: 'https://attacker.example', authorization: `Bearer ${await token()}` } },
  ]) { const res = response(); await handler(req, res); assert.ok([401, 403].includes(res.code)); assert.equal(res.headers['Set-Cookie'], undefined); }
});
test('logout expires the shared session and preview hosts never get production-domain cookies', async () => {
  const res = response(); await handler({ method: 'DELETE', headers }, res);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
  const preview = response();
  await handler({ method: 'POST', headers: { host: 'release.vercel.app', origin: 'https://release.vercel.app', authorization: `Bearer ${await token()}` } }, preview);
  assert.equal(preview.code, 200); assert.equal(preview.headers['Set-Cookie'].includes('Domain='), false);
});
