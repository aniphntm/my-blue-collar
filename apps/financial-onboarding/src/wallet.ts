export type Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (value?: unknown) => void): void;
  removeListener?(event: string, listener: (value?: unknown) => void): void;
};
type State = { busy: boolean; address: string | null; authenticated: boolean; message: string };
const validAddress = (v: unknown): v is string => typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v) && !/^0x0{40}$/.test(v);
export function createWalletConnection(update: (s: State) => void, request = fetch) {
  let generation = 0;
  let provider: Provider | null = null;
  let cleanup = () => {};
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let state: State = { busy: false, address: null, authenticated: false, message: 'Choose a browser wallet. Connecting does not sign you in.' };
  let queue: Promise<unknown> = Promise.resolve();
  const publish = (patch: Partial<State>) => { state = { ...state, ...patch }; update({ ...state }); };
  // Serialize mutations so cancel/account changes revoke even an in-flight challenge or verification.
  function api(method: string, body?: object): Promise<Record<string, any>> {
    const operation = queue.then(async () => {
      const res = await request('/api/session', { method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10000),
        headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Session request failed.');
      return data;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  async function forget(message = 'Signed out. You can reconnect your wallet.') {
    const attempt = ++generation; cleanup(); cleanup = () => {}; clearTimeout(expiry); provider = null;
    publish({ busy: true, address: null, authenticated: false, message: 'Revoking this session…' });
    try { await api('DELETE'); if (attempt === generation) publish({ busy: false, message }); }
    catch { if (attempt === generation) publish({ busy: false, message: 'Could not confirm server logout. Retry disconnect; the session expires within one hour. Funding remains paused.' }); }
  }
  async function connect(next: Provider) {
    if (state.busy) return;
    const attempt = ++generation;
    cleanup(); clearTimeout(expiry); provider = next;
    const changed = () => { void forget('Wallet account or network changed. Connect and sign in again.'); };
    for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) next.on?.(event, changed);
    cleanup = () => { for (const event of ['accountsChanged', 'chainChanged', 'disconnect']) next.removeListener?.(event, changed); };
    publish({ busy: true, authenticated: false, address: null, message: 'Approve account access in your wallet.' });
    try {
      await api('DELETE'); // Reconnecting never silently inherits a different account's session.
      if (attempt !== generation) return;
      const accounts = await next.request({ method: 'eth_requestAccounts' });
      const chain = await next.request({ method: 'eth_chainId' });
      if (attempt !== generation) return;
      if (!Array.isArray(accounts) || !validAddress(accounts[0])) throw new Error('No valid wallet account was shared.');
      if (typeof chain !== 'string' || !/^0x[0-9a-fA-F]+$/.test(chain) || BigInt(chain) !== 8453n) throw new Error('Select Base in your wallet, then reconnect.');
      publish({ busy: false, address: accounts[0], message: 'Connected only. Select Verify wallet to sign an authentication message.' });
    } catch (error) {
      if (attempt !== generation) return;
      cleanup(); provider = null;
      publish({ busy: false, address: null, message: error instanceof Error ? error.message : 'Connection cancelled. You can retry.' });
    }
  }
  async function verify() {
    if (state.busy || !provider || !state.address || state.authenticated) return;
    const attempt = ++generation, active = provider, address = state.address;
    publish({ busy: true, message: 'Review the sign-in message. This does not approve spending.' });
    try {
      const challenge = await api('POST', { action: 'challenge', address, chainId: 8453 });
      if (attempt !== generation) return;
      if (typeof challenge.message !== 'string' || challenge.message.length > 2048) throw new Error('Invalid sign-in challenge.');
      const hex = '0x' + Array.from(new TextEncoder().encode(challenge.message), b => b.toString(16).padStart(2, '0')).join('');
      const signature = await active.request({ method: 'personal_sign', params: [hex, address] });
      if (attempt !== generation) return;
      const accounts = await active.request({ method: 'eth_accounts' });
      const chain = await active.request({ method: 'eth_chainId' });
      if (attempt !== generation) return;
      if (!Array.isArray(accounts) || !validAddress(accounts[0]) || accounts[0].toLowerCase() !== address.toLowerCase() || typeof chain !== 'string' || BigInt(chain) !== 8453n) throw new Error('Wallet changed. Reconnect before signing in.');
      const session = await api('POST', { action: 'verify', signature });
      if (attempt !== generation) return;
      if (!session.authenticated || session.wallet?.address?.toLowerCase() !== address.toLowerCase() || session.wallet?.chainId !== 8453 || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) throw new Error('Invalid session response.');
      publish({ busy: false, authenticated: true, message: 'Wallet verified on Base. Funding remains paused.' });
      expiry = setTimeout(() => { void forget('Session expired. Sign in again with the same wallet.'); }, Math.max(0, session.expiresAt - Date.now()));
    } catch (error) {
      if (attempt !== generation) return;
      await forget(error instanceof Error ? error.message : 'Signature cancelled. You can reconnect and retry.');
    }
  }
  return { connect, verify, forget };
}

if (typeof document !== 'undefined') {
  const status = document.getElementById('wallet-status')!;
  const address = document.getElementById('wallet-address')!;
  const verify = document.getElementById('verify-wallet') as HTMLButtonElement;
  const choices = document.getElementById('wallet-choices')!;
  const controller = createWalletConnection(state => {
    status.textContent = state.message; address.textContent = state.address || 'No receiving wallet verified';
    verify.disabled = state.busy || !state.address || state.authenticated;
    choices.querySelectorAll('button').forEach(b => { b.disabled = state.busy; });
  });
  verify.addEventListener('click', () => { void controller.verify(); });
  document.getElementById('forget-wallet')!.addEventListener('click', () => { void controller.forget(); });
  const seen = new Set<Provider>();
  function add(provider: Provider, name: string) {
    if (!provider || typeof provider.request !== 'function' || seen.has(provider) || seen.size >= 20) return;
    seen.add(provider);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'choice';
    button.textContent = name.slice(0, 80); button.addEventListener('click', () => { void controller.connect(provider); }); choices.append(button);
  }
  window.addEventListener('eip6963:announceProvider', ((event: CustomEvent) => {
    const detail = event.detail;
    if (typeof detail?.info?.name === 'string') add(detail.provider, detail.info.name);
  }) as EventListener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  const injected = (window as Window & { ethereum?: Provider }).ethereum;
  if (injected) add(injected, 'Browser wallet');
  // Never silently restore verified UI without checking the active wallet. Reconnect re-authenticates.
  status.textContent = 'Choose an installed browser wallet, then verify ownership. On mobile, use your wallet’s built-in browser. If none appears, open this page there.';
}
