import { randomBytes, createHash } from 'node:crypto';
import { getAddress, recoverMessageAddress } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { createStore } from './store.mjs';

export const COOKIE = '__Host-myblue-session';
export const CHAIN_ID = 8453;
export const CHALLENGE_SECONDS = 300;
export const SESSION_SECONDS = 3600;
const attributes = 'Path=/; HttpOnly; Secure; SameSite=Strict';
export function userPath(subject) { return createHash('sha256').update(subject).digest('hex').slice(0, 32); }
export function trustedOrigin(req, env = process.env) {
  try {
    const origin = env.AUTH_ORIGIN;
    const url = new URL(origin);
    if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password || req.headers.host !== url.host) return null;
    if (['cross-site', 'same-site'].includes(req.headers['sec-fetch-site'])) return null;
    if (req.headers.origin !== origin && !(req.method === 'GET' && req.headers.origin === undefined)) return null;
    return origin;
  } catch { return null; }
}
export function cookieToken(req) {
  const matches = (req.headers.cookie || '').split(';').map(x => x.trim()).filter(x => x.startsWith(`${COOKIE}=`));
  const token = matches.length === 1 ? matches[0].slice(COOKIE.length + 1) : '';
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function parseBody(req, keys) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new Error('JSON required');
  let body = req.body;
  if (typeof body === 'string') { if (body.length > 2048) throw new Error('Too large'); body = JSON.parse(body); }
  if (!body || Array.isArray(body) || typeof body !== 'object' || JSON.stringify(body).length > 2048
    || Object.keys(body).some(key => !keys.includes(key))) throw new Error('Invalid body');
  return body;
}
export async function authenticatedSession(req, store, origin, now = Date.now()) {
  const token = cookieToken(req);
  if (!token) return null;
  const value = await store.get(token);
  if (value?.kind !== 'session' || value.origin !== origin || value.chainId !== CHAIN_ID
    || !Number.isFinite(value.expiresAt) || value.expiresAt <= now) return null;
  try { if (getAddress(value.address) !== value.address || /^0x0{40}$/.test(value.address)) return null; } catch { return null; }
  return value;
}
export function makeHandler({ env = process.env, store, now = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Vary', 'Cookie, Origin, Sec-Fetch-Site');
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'GET, POST, DELETE'); return res.status(405).json({ error: 'Method not allowed' }); }
    if (!env.AUTH_ORIGIN) return res.status(503).json({ error: 'Wallet sign-in is not configured yet.' });
    const origin = trustedOrigin(req, env);
    if (!origin) return res.status(403).json({ error: 'Invalid origin' });
    try {
      const db = store || createStore(env);
      const token = cookieToken(req);
      if (req.method === 'DELETE') {
        if (token) await db.remove(token);
        // Expire legacy host/domain cookies during migration; they are never accepted as authentication.
        const clear = [`${COOKIE}=; ${attributes}; Max-Age=0`, `__Secure-myblue-session=; ${attributes}; Max-Age=0`];
        if (new URL(origin).hostname === 'mybluefinancial.com' || new URL(origin).hostname.endsWith('.mybluefinancial.com')) clear.push(`__Secure-myblue-session=; ${attributes}; Domain=mybluefinancial.com; Max-Age=0`);
        res.setHeader('Set-Cookie', clear);
        return res.status(200).json({ authenticated: false });
      }
      if (req.method === 'GET') {
        const session = await authenticatedSession(req, db, origin, now());
        if (!session) return res.status(401).json({ error: 'Sign in with your wallet to continue.' });
        return res.status(200).json({ authenticated: true, wallet: { address: session.address, chainId: session.chainId }, expiresAt: session.expiresAt,
          userPath: userPath(`eip155:${session.chainId}:${session.address.toLowerCase()}`) });
      }
      let body;
      try { body = parseBody(req, ['action', 'address', 'chainId', 'signature']); } catch { return res.status(400).json({ error: 'Invalid sign-in request.' }); }
      if (body.action === 'challenge') {
        if (Object.keys(body).some(k => !['action', 'address', 'chainId'].includes(k)) || body.chainId !== CHAIN_ID) return res.status(400).json({ error: 'Select Base in your wallet.' });
        let address;
        try { address = getAddress(body.address); if (/^0x0{40}$/.test(address)) throw new Error(); } catch { return res.status(400).json({ error: 'Invalid wallet address.' }); }
        if (!await db.allow(origin)) return res.status(429).json({ error: 'Too many sign-in attempts. Try again shortly.' });
        if (token) await db.remove(token);
        const id = randomBytes(32).toString('hex');
        const issuedAt = now(); const expiresAt = issuedAt + CHALLENGE_SECONDS * 1000;
        const message = createSiweMessage({ domain: new URL(origin).host, address, statement: 'Sign in to MyBlue Financial. This does not authorize transactions.',
          uri: `${origin}/wallet`, version: '1', chainId: CHAIN_ID, nonce: randomBytes(16).toString('hex'), issuedAt: new Date(issuedAt), expirationTime: new Date(expiresAt) });
        await db.put(id, { kind: 'challenge', address, origin, chainId: CHAIN_ID, message, expiresAt }, CHALLENGE_SECONDS);
        res.setHeader('Set-Cookie', `${COOKIE}=${id}; ${attributes}; Max-Age=${SESSION_SECONDS}`);
        return res.status(200).json({ message, expiresAt });
      }
      if (body.action !== 'verify' || Object.keys(body).some(k => !['action', 'signature'].includes(k)) || !/^0x[0-9a-fA-F]{130}$/.test(body.signature)) return res.status(400).json({ error: 'Invalid signature request.' });
      const challenge = token ? await db.get(token) : null;
      if (challenge?.kind !== 'challenge' || challenge.origin !== origin || challenge.chainId !== CHAIN_ID || challenge.expiresAt <= now()) return res.status(401).json({ error: 'Challenge expired or cancelled. Sign in again.' });
      let verified = false;
      try { verified = await recoverMessageAddress({ message: challenge.message, signature: body.signature }) === challenge.address; } catch { /* Fail closed; EOA signatures only. */ }
      if (!verified) return res.status(401).json({ error: 'Wallet signature did not match.' });
      const expiresAt = now() + SESSION_SECONDS * 1000;
      if (challenge.expiresAt <= now() || !await db.replace(token, challenge, { kind: 'session', address: challenge.address, chainId: CHAIN_ID, origin, expiresAt }, SESSION_SECONDS)) return res.status(401).json({ error: 'Challenge already used or cancelled. Sign in again.' });
      // No second Set-Cookie: a late verify response cannot recreate a cookie after logout.
      return res.status(200).json({ authenticated: true, wallet: { address: challenge.address, chainId: CHAIN_ID }, expiresAt });
    } catch { return res.status(503).json({ error: 'Secure session service unavailable. Please retry; funding remains paused.' }); }
  };
}
