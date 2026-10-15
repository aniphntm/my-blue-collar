import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, usePrivy, useCreateWallet } from '@privy-io/react-auth';

const candidate = new URLSearchParams(location.search).get('provider');
const provider = ['coinbase', 'robinhood', 'walletconnect'].includes(candidate || '') ? candidate! : 'coinbase';

function Account() {
  const { ready, authenticated, user, login, logout, getAccessToken, exportWallet } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const isCreate = document.body.dataset.page === 'create';
  const embedded = user?.linkedAccounts.find(account => account.type === 'wallet' && account.walletClientType === 'privy' && account.chainType === 'ethereum');
  const linkedWallet = user?.linkedAccounts.find(account => account.type === 'wallet' && account.chainType === 'ethereum');
  const wallet = provider === 'walletconnect' ? linkedWallet : embedded;

  async function continueToOnboarding() {
    setBusy(true); setMessage('Verifying your MyBlue session…');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Sign in to continue.');
      const response = await fetch('/api/session', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok || !/^[a-f0-9]{32}$/.test(data.userPath)) throw new Error(data.error || 'Unable to verify your session.');
      location.assign(`https://onboard.mybluefinancial.com/${data.userPath}?provider=${provider}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); setBusy(false); }
  }

  async function create() {
    if (busy || embedded) return;
    setBusy(true); setMessage('Creating your personal wallet…');
    try { await createWallet(); setMessage('Your wallet is ready. Continue to onboarding.'); }
    catch { setMessage('Wallet creation did not complete. You can try again.'); }
    finally { setBusy(false); }
  }

  if (!ready) return <p className="note" role="status">Preparing secure sign-in…</p>;
  if (!authenticated) return <>
    <button className="primary" onClick={() => login({ loginMethods: provider === 'walletconnect' && isCreate ? ['wallet'] : ['email', 'wallet'] })}>{provider === 'walletconnect' && isCreate ? 'Sign in with your wallet' : 'Sign in / Create account with Privy'} →</button>
    <p className="note">{provider === 'walletconnect' ? 'Approve a wallet connection and sign the login challenge. No new wallet is created automatically.' : 'Verify your email or use your existing wallet. You choose whether to create an embedded wallet after signing in.'}</p>
  </>;
  return <>
    <p className="note">Signed in to MyBlue.</p>
    {!isCreate ? <a className="primary" href={`/create?provider=${provider}`}>Continue to wallet setup →</a> : <>
      {wallet && 'address' in wallet ? <div className="wallet-box"><strong>Your {embedded === wallet ? 'MyBlue' : 'connected'} wallet</strong><span style={{ overflowWrap: 'anywhere' }}>{wallet.address}</span></div> : null}
      {!wallet && provider !== 'walletconnect' ? <><p className="body-copy">Create a personal EVM wallet with Privy. You control approvals and can export the wallet. This does not fund it.</p><button disabled={busy} className="primary" onClick={create}>Create my wallet →</button></> : null}
      {!wallet && provider === 'walletconnect' ? <p className="note">Sign out and choose wallet sign-in to connect and authenticate your existing wallet.</p> : null}
      {wallet ? <button disabled={busy} className="primary" onClick={continueToOnboarding}>Continue to onboarding →</button> : null}
      {embedded ? <button className="secondary" onClick={() => { void exportWallet().catch(() => setMessage('Wallet export did not complete. Please try again.')); }}>Export my wallet securely</button> : null}
    </>}
    <button disabled={busy} className="secondary" onClick={async () => { await fetch('/api/session', { method: 'DELETE' }); await logout(); }}>Sign out</button>
    <p role="status" aria-live="polite" className="note">{message}</p>
  </>;
}

async function mount() {
  const root = createRoot(document.getElementById('privy-auth')!);
  try {
    const response = await fetch('/api/config');
    const { appId } = await response.json();
    if (!appId) throw new Error('Secure sign-in is not configured yet. Please check back shortly.');
    root.render(<PrivyProvider appId={appId} config={{ loginMethods: ['email', 'wallet'], appearance: { theme: 'light', accentColor: '#163ff3', walletList: ['detected_wallets', 'wallet_connect'] }, embeddedWallets: { ethereum: { createOnLogin: 'off' } } }}><Account /></PrivyProvider>);
  } catch {
    root.render(<p className="note" role="status">Secure sign-in is being configured. Please check back shortly.</p>);
  }
}
void mount();
