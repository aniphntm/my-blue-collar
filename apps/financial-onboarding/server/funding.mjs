import { createPrivateKey, createPublicKey, randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import { userPath, verifyToken } from './session.mjs';

const SESSION_URL = 'https://api.cdp.coinbase.com/platform/v2/onramp/sessions';
const SESSION_URI = 'POST api.cdp.coinbase.com/platform/v2/onramp/sessions';
const HOSTS = ['mybluefinancial.com', 'www.mybluefinancial.com', 'onboard.mybluefinancial.com'];
const COOKIE = '__Secure-myblue-session';
const DEFAULTS = { asset: 'USDC', network: 'base' };
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function trustedOrigin(req, env) {
  const origins = HOSTS.map(host => `https://${host}`);
  if (env.FUNDING_PREVIEW_ORIGIN) {
    try {
      const preview = new URL(env.FUNDING_PREVIEW_ORIGIN);
      if (preview.protocol === 'https:' && preview.origin === env.FUNDING_PREVIEW_ORIGIN && !preview.username && !preview.password) origins.push(preview.origin);
    } catch { /* Invalid preview configuration never widens access. */ }
  }
  const expected = `https://${req.headers.host}`;
  if (!origins.includes(expected)) return false;
  if (req.headers.origin !== undefined) return req.headers.origin === expected;
  return req.method === 'GET' && !['cross-site', 'same-site'].includes(req.headers['sec-fetch-site']);
}

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

export async function resolveWallet(subject, env, fetchImpl, timeoutMs = 8000) {
  const user = await requestJSON(fetchImpl, `https://api.privy.io/v1/users/${encodeURIComponent(subject)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${env.PRIVY_APP_ID}:${env.PRIVY_APP_SECRET}`).toString('base64')}`, 'privy-app-id': env.PRIVY_APP_ID },
  }, timeoutMs);
  if (user?.id !== subject || !Array.isArray(user.linked_accounts)) throw new Error('Invalid user');
  const wallet = user.linked_accounts.find(account => account.type === 'wallet' && account.chain_type === 'ethereum' && account.wallet_client_type === 'privy'
    && typeof account.address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(account.address) && !/^0x0{40}$/.test(account.address));
  return wallet ? { address: wallet.address, chainType: 'ethereum', walletClientType: 'privy' } : null;
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

export function makeHandler({ verify = verifyToken, fetchImpl = globalThis.fetch, env = process.env, timeoutMs = 8000 } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Cookie, Origin, Sec-Fetch-Site');
    if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
    if (!trustedOrigin(req, env)) return res.status(403).json({ error: 'Invalid origin' });
    const cookies = (req.headers.cookie || '').split(';').map(value => value.trim()).filter(value => value.startsWith(`${COOKIE}=`));
    const token = cookies.length === 1 ? cookies[0].slice(COOKIE.length + 1) : null;
    if (!token || token.length > 8192) return res.status(401).json({ error: 'Sign in to continue.' });
    let claims;
    try {
      claims = await verify(token);
      if (typeof claims.sub !== 'string' || !claims.sub.startsWith('did:privy:')) throw new Error('Invalid identity');
    } catch { return res.status(401).json({ error: 'Your sign-in has expired. Please sign in again.' }); }
    if (req.method === 'POST') {
      let body = req.body;
      try { if (typeof body === 'string' && body.length <= 1024) body = JSON.parse(body); } catch { body = null; }
      if (!body || typeof body !== 'object' || Array.isArray(body) || !['coinbase', 'robinhood'].includes(body.provider) || Object.keys(body).some(key => key !== 'provider')) return res.status(400).json({ error: 'Choose a supported funding provider.' });
      if (body.provider === 'robinhood') return res.status(503).json({ error: 'Robinhood funding is not available yet. You can fund later or choose Coinbase.' });
    }
    const mode = env.COINBASE_ONRAMP_MODE || 'sandbox';
    const walletConfigured = !!(env.PRIVY_APP_ID && env.PRIVY_APP_SECRET);
    let coinbaseConfigured = !!(walletConfigured && env.CDP_API_KEY_ID && env.CDP_API_KEY_SECRET && ['sandbox', 'production'].includes(mode));
    if (coinbaseConfigured) {
      try { coinbaseKey(env.CDP_API_KEY_SECRET); } catch { coinbaseConfigured = false; }
    }
    let wallet = null;
    if (walletConfigured) {
      try { wallet = await resolveWallet(claims.sub, env, fetchImpl, timeoutMs); }
      catch { return res.status(502).json({ error: 'Unable to verify your receiving wallet. Please try again.' }); }
    }
    const available = coinbaseConfigured && !!wallet;
    if (req.method === 'GET') return res.status(200).json({ authenticated: true, wallet, ...DEFAULTS,
      balances: await readBalances(wallet, env, fetchImpl, timeoutMs),
      providers: { robinhood: { available: false, mode: 'unavailable', reason: 'partner_setup_required' }, coinbase: { available, mode: ['sandbox', 'production'].includes(mode) ? mode : 'unavailable', reason: available ? null : !walletConfigured ? 'wallet_verification_not_configured' : !wallet ? 'embedded_wallet_required' : 'provider_not_configured' } } });
    if (!available) return res.status(503).json({ error: 'Coinbase funding is not available yet.' });
    try {
      const path = userPath(claims.sub);
      const authorization = await createCoinbaseJWT(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET);
      const result = await requestJSON(fetchImpl, SESSION_URL, { method: 'POST', headers: { Authorization: `Bearer ${authorization}`, 'Content-Type': 'application/json' }, body: JSON.stringify({
        purchaseCurrency: DEFAULTS.asset, destinationNetwork: DEFAULTS.network, destinationAddress: wallet.address,
        partnerUserRef: `${mode === 'production' ? '' : 'sandbox-'}${path}`,
        redirectUrl: `https://onboard.mybluefinancial.com/${path}?provider=coinbase&funding=returned`,
      }) }, timeoutMs);
      return res.status(200).json({ provider: 'coinbase', mode, ...DEFAULTS, url: validateCoinbaseUrl(result?.session?.onrampUrl, mode) });
    } catch { return res.status(502).json({ error: 'Unable to start Coinbase funding. Please try again.' }); }
  };
}
