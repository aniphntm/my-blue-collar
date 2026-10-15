const params = new URLSearchParams(location.search);
const selection = params.get('provider');
const names = { coinbase: 'Coinbase', robinhood: 'Robinhood', walletconnect: 'WalletConnect' };
const provider = Object.hasOwn(names, selection) ? selection : 'coinbase';
document.querySelectorAll('[data-provider]').forEach(node => { node.textContent = names[provider]; });
const button = document.getElementById('preview-provider');
const alternative = document.getElementById('coinbase-funding');
const later = document.getElementById('fund-later');
const status = document.getElementById('setup-status');
const balanceStatus = document.getElementById('balance-status');
const returned = params.get('funding') === 'returned';
const returnCopy = returned ? 'You returned from the funding provider. A purchase or deposit has not been confirmed. ' : '';
button.hidden = true; later.hidden = true; alternative.hidden = true;

function validLaunch(data, mode) {
  if (data?.provider !== 'coinbase' || data.mode !== mode || data.asset !== 'USDC' || data.network !== 'base'
    || typeof data.url !== 'string' || data.url.length > 16384 || /[\u0000-\u0020\\]/.test(data.url)) throw new Error('Invalid launch');
  const url = new URL(data.url);
  const origins = mode === 'sandbox' ? ['https://pay.coinbase.com', 'https://pay-sandbox.coinbase.com'] : ['https://pay.coinbase.com'];
  if (!origins.includes(url.origin) || url.username || url.password || url.hash) throw new Error('Invalid launch');
  return url.href;
}

async function loadSession() {
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    const session = await response.json();
    if (!response.ok || !session.authenticated) {
      document.querySelector('[data-setup-title]').textContent = 'Sign in to continue.';
      document.querySelector('[data-setup-copy]').textContent = 'Your MyBlue account keeps your setup private.';
      status.textContent = 'Your session is missing or expired. Return to MyBlue Financial to sign in.';
      const link = document.createElement('a'); link.className = 'primary';
      link.href = `https://mybluefinancial.com/create?provider=${provider}`;
      link.textContent = 'Sign in to MyBlue →'; status.before(link); return;
    }
    const path = location.pathname.replace(/^\/+|\/+$/g, '');
    if (path && path !== session.userPath) {
      location.replace(`https://onboard.mybluefinancial.com/${session.userPath}?provider=${provider}${returned ? '&funding=returned' : ''}`); return;
    }
    if (!path && location.hostname === 'onboard.mybluefinancial.com') history.replaceState(null, '', `/${session.userPath}?provider=${provider}${returned ? '&funding=returned' : ''}`);
    document.querySelector('[data-setup-title]').textContent = 'Your MyBlue account is verified.';
    document.querySelector('[data-setup-copy]').textContent = 'Adding funds is optional. Manage or export your wallet at MyBlue Financial.';
    later.hidden = false;
    later.addEventListener('click', () => { location.assign(`https://mybluefinancial.com/create?provider=${provider}`); });
    if (provider === 'walletconnect') {
      button.hidden = false; button.textContent = 'Manage my wallet →';
      button.addEventListener('click', () => { location.assign('https://mybluefinancial.com/create?provider=walletconnect'); });
    }
    status.textContent = `${returnCopy}Loading your funding options…`;
    const fundingResponse = await fetch('/api/funding', { credentials: 'same-origin', cache: 'no-store' });
    const funding = await fundingResponse.json();
    if (!fundingResponse.ok || funding.authenticated !== true) throw new Error('Funding unavailable');
    const wallet = funding.wallet;
    const validWallet = wallet?.chainType === 'ethereum' && wallet.walletClientType === 'privy'
      && /^0x[0-9a-fA-F]{40}$/.test(wallet.address) && !/^0x0{40}$/.test(wallet.address);
    const validDefaults = funding.asset === 'USDC' && funding.network === 'base';
    if (validWallet && validDefaults) {
      document.getElementById('funding-details').hidden = false;
      document.getElementById('funding-destination').textContent = 'Receive USDC on Base';
      document.getElementById('funding-address').textContent = `Your receiving address: ${wallet.address}`;
    }
    const coinbase = funding.providers?.coinbase;
    const canLaunch = validWallet && validDefaults && coinbase?.available === true && ['sandbox', 'production'].includes(coinbase.mode);
    document.getElementById('funding-mode').textContent = coinbase?.mode === 'sandbox'
      ? 'Coinbase sandbox — testing only; no real purchase.' : coinbase?.mode === 'production' ? 'Coinbase production — review costs and transfer details with Coinbase.' : 'Coinbase funding is unavailable.';
    const balances = funding.balances;
    balanceStatus.hidden = false;
    if (validWallet && balances?.available === true && balances.network === 'base'
      && balances.native?.asset === 'ETH' && balances.token?.asset === 'USDC'
      && /^\d+(\.\d{1,18})?$/.test(balances.native.amount) && /^\d+(\.\d{1,6})?$/.test(balances.token.amount)
      && typeof balances.observedAt === 'string' && Number.isFinite(Date.parse(balances.observedAt))) {
      balanceStatus.textContent = `Observed on Base: ${balances.token.amount} USDC · ${balances.native.amount} ETH. Checked ${balances.observedAt}. Balances do not confirm a provider purchase.`;
    } else balanceStatus.textContent = 'Base balances are unavailable. No balance or purchase has been confirmed.';
    status.textContent = returnCopy + (provider === 'robinhood'
      ? 'Robinhood funding is not available yet. You can fund later or choose Coinbase.'
      : canLaunch ? 'Review your receiving address and USDC on Base above before continuing. Funding is optional.'
        : !validWallet ? 'Your receiving wallet is not available yet. Create or manage your embedded wallet at MyBlue Financial, or fund later.'
          : 'Coinbase funding is not available yet. You can fund later.');
    if (canLaunch && provider !== 'walletconnect') {
      const launchButton = provider === 'robinhood' ? alternative : button;
      launchButton.hidden = false;
      launchButton.textContent = `${provider === 'robinhood' ? 'Choose' : 'Continue with'} Coinbase${coinbase.mode === 'sandbox' ? ' (sandbox)' : ''} →`;
      launchButton.addEventListener('click', async () => {
        if (launchButton.disabled) return;
        launchButton.disabled = true;
        status.textContent = `${returnCopy}Preparing Coinbase${coinbase.mode === 'sandbox' ? ' sandbox' : ''} funding…`;
        try {
          const launchResponse = await fetch('/api/funding', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'coinbase' }) });
          const data = await launchResponse.json();
          if (!launchResponse.ok) throw new Error('Funding unavailable');
          location.assign(validLaunch(data, coinbase.mode));
        } catch {
          status.textContent = `${returnCopy}Unable to start Coinbase funding. Please try again or fund later.`;
          launchButton.disabled = false;
        }
      });
    }
  } catch { status.textContent = `${returnCopy}Unable to load verified funding options right now. Please refresh or return to MyBlue Financial.`; }
}
void loadSession();
