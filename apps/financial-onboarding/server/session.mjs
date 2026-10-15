import { createHash } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

let jwks;
export function userPath(subject) {
  return createHash('sha256').update(subject).digest('hex').slice(0, 32);
}
export async function verifyToken(token, key) {
  const appId = process.env.PRIVY_APP_ID;
  if (!appId) throw new Error('Authentication unavailable');
  jwks ??= createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${encodeURIComponent(appId)}/jwks.json`));
  const { payload } = await jwtVerify(token, key || jwks, {
    issuer: 'privy.io', audience: appId, algorithms: ['ES256'], requiredClaims: ['sub', 'exp', 'iat'],
  });
  if (typeof payload.sub !== 'string' || !payload.sub.startsWith('did:privy:')) throw new Error('Invalid identity');
  return payload;
}

export function makeHandler(verify = verifyToken) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Cookie');
    const host = (req.headers.host || '').split(':')[0];
    const production = ['mybluefinancial.com', 'www.mybluefinancial.com', 'onboard.mybluefinancial.com'].includes(host);
    const cookie = '__Secure-myblue-session';
    const attributes = `Path=/; HttpOnly; Secure; SameSite=Lax${production ? '; Domain=mybluefinancial.com' : ''}`;
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
    if (req.method !== 'GET' && req.headers.origin !== `https://${host}`) return res.status(403).json({ error: 'Invalid origin' });
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', `${cookie}=; ${attributes}; Max-Age=0`);
      return res.status(200).json({ authenticated: false });
    }
    if (!process.env.PRIVY_APP_ID) return res.status(503).json({ error: 'Secure sign-in is not configured yet.' });
    const token = req.method === 'POST'
      ? req.headers.authorization?.replace(/^Bearer /, '')
      : (req.headers.cookie || '').split('; ').find(item => item.startsWith(`${cookie}=`))?.slice(cookie.length + 1);
    if (!token || token.length > 8192) return res.status(401).json({ error: 'Sign in to continue.' });
    try {
      const claims = await verify(token);
      if (req.method === 'POST') {
        const ttl = Math.max(0, Math.floor(claims.exp - Date.now() / 1000));
        res.setHeader('Set-Cookie', `${cookie}=${token}; ${attributes}; Max-Age=${ttl}`);
      }
      // The URL is a stable identifier, never an authorization credential.
      return res.status(200).json({ authenticated: true, userPath: userPath(claims.sub) });
    } catch {
      return res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' });
    }
  };
}
