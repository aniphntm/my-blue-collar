import { createPrivateKey, createPublicKey, randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import { authenticatedSession, trustedOrigin, parseBody } from './session.mjs';
import { createStore } from './store.mjs';

export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const SESSION_URI = 'POST api.cdp.coinbase.com/platform/v2/onramp/sessions';

export function coinbaseKey(secret) {
  if (typeof secret !== 'string') throw new Error('Invalid key');
  if (secret.includes('-----BEGIN')) {
    const key = createPrivateKey(secret.replace(/\\n/g, '\n'));
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') throw new Error('Invalid key');
    return { key, alg: 'ES256' };
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(secret)) throw new Error('Invalid key');
  const raw = Buffer.from(secret, 'base64');
  if (raw.length !== 64) throw new Error('Invalid key');
  const key = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), raw.subarray(0, 32)]), format: 'der', type: 'pkcs8' });
  const pub = createPublicKey(key).export({ format: 'jwk' });
  if (!Buffer.from(pub.x, 'base64url').equals(raw.subarray(32))) throw new Error('Invalid key');
  return { key, alg: 'EdDSA' };
}

export async function createCoinbaseJWT(keyId, secret, now = Math.floor(Date.now() / 1000)) {
  const { key, alg } = coinbaseKey(secret);
  return new SignJWT({ uris: [SESSION_URI] }).setProtectedHeader({ alg, kid: keyId, nonce: randomBytes(16).toString('hex'), typ: 'JWT' })
    .setIssuer('cdp').setSubject(keyId).setNotBefore(now).setExpirationTime(now + 120).sign(key);
}

export function validateCoinbaseUrl(value, mode) {
  if (typeof value !== 'string' || value.length > 16384) throw new Error('Invalid provider URL');
  const url = new URL(value);
  const origins = ['https://pay.coinbase.com'];
  if (mode === 'sandbox') origins.push('https://pay-sandbox.coinbase.com');
  if (!origins.includes(url.origin) || url.username || url.password || url.hash || /[\u0000-\u0020\\]/.test(value)) throw new Error('Invalid provider URL');
  return url.href;
}

async function requestJSON(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  let timer;
  try {
    // Race covers both headers and body, even if a transport ignores abort.
    return await Promise.race([
      (async () => {
        const result = await fetchImpl(url, { ...options, redirect: 'error', signal: controller.signal });
        if (!result.ok) throw new Error('Provider request failed');
        return await result.json();
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Provider request timed out')); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

// Integer arithmetic preserves every wei and USDC base unit, including large balances.
export function formatUnits(value, decimals) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{1,64}$/.test(value)) throw new Error('Invalid balance');
  const digits = BigInt(value).toString().padStart(decimals + 1, '0');
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return `${digits.slice(0, -decimals)}${fraction ? `.${fraction}` : ''}`;
}

export async function readBalances(wallet, env, fetchImpl, timeoutMs = 8000) {
  const unavailable = reason => ({ available: false, network: 'base', reason });
  if (!wallet) return unavailable('verified_wallet_required');
  if (!env.ALCHEMY_API_KEY) return unavailable('not_configured');
  // Restrict the key to one URL path segment; neither host nor chain is configurable.
  if (!/^[A-Za-z0-9_-]{1,256}$/.test(env.ALCHEMY_API_KEY)) return unavailable('not_configured');
  try {
    const endpoint = `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`;
    async function rpc(id, method, params) {
      const data = await requestJSON(fetchImpl, endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) }, timeoutMs);
      if (data?.jsonrpc !== '2.0' || data.id !== id || data.error || data.result === undefined) throw new Error('Invalid balance response');
      return data.result;
    }
    const [native, tokens] = await Promise.all([
      rpc(1, 'eth_getBalance', [wallet.address, 'latest']),
      rpc(2, 'alchemy_getTokenBalances', [wallet.address, [BASE_USDC]]),
    ]);
    if (typeof tokens?.address !== 'string' || tokens.address.toLowerCase() !== wallet.address.toLowerCase()
      || !Array.isArray(tokens.tokenBalances) || tokens.tokenBalances.length !== 1) throw new Error('Invalid token response');
    const token = tokens.tokenBalances[0];
    if (typeof token?.contractAddress !== 'string' || token.contractAddress.toLowerCase() !== BASE_USDC.toLowerCase() || token.error != null) throw new Error('Invalid token response');
    return { available: true, network: 'base', observedAt: new Date().toISOString(),
      native: { asset: 'ETH', amount: formatUnits(native, 18) }, token: { asset: 'USDC', amount: formatUnits(token.tokenBalance, 6) } };
  } catch { return unavailable('upstream_unavailable'); }
}

// Release interlock: deliberately no environment switch and no provider-launch call.
// Re-enable only in a reviewed change after the README release checks have evidence.
export function makeHandler({ env = process.env, store, now = Date.now } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Cookie, Origin, Sec-Fetch-Site');
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
    if (!env.AUTH_ORIGIN) return res.status(503).json({ error: 'Funding is paused pending security and provider checks.' });
    const origin = trustedOrigin(req, env);
    if (!origin) return res.status(403).json({ error: 'Invalid origin' });
    try {
      const session = await authenticatedSession(req, store || createStore(env), origin, now());
      if (!session) return res.status(401).json({ error: 'Verified wallet sign-in required.' });
      if (req.method === 'POST') {
        let body;
        try { body = parseBody(req, ['provider']); } catch { return res.status(400).json({ error: 'Invalid funding request.' }); }
        if (!['coinbase', 'robinhood'].includes(body.provider)) return res.status(400).json({ error: 'Choose a supported funding provider.' });
        return res.status(503).json({ error: 'Funding is paused pending security and provider checks.' });
      }
      return res.status(200).json({ authenticated: true, wallet: { address: session.address, chainId: session.chainId }, asset: 'USDC', network: 'base',
        balances: { available: false, reason: 'paused' }, providers: {
          coinbase: { available: false, mode: 'unavailable', reason: 'security_and_provider_checks_required' },
          robinhood: { available: false, mode: 'unavailable', reason: 'partner_setup_required' },
        } });
    } catch { return res.status(503).json({ error: 'Secure session service unavailable. Funding remains paused.' }); }
  };
}
