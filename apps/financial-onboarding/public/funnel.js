// Provider choice is a preference, never proof of authentication.
const providers = {
  coinbase: { name: 'Coinbase', next: 'Coinbase Onramp opens after a verified MyBlue wallet is ready. You review eligibility, the receiving address, network, fees, and transfer before approval.' },
  robinhood: { name: 'Robinhood', next: 'Robinhood Connect opens after a verified MyBlue wallet is ready. You sign in with Robinhood and review eligibility, fees, and the receiving wallet before approving funding.' },
  walletconnect: { name: 'WalletConnect', next: 'Choose a wallet in WalletConnect, approve the connection, then complete a separate sign-in challenge. A connection alone does not authenticate your MyBlue account.' },
};
const candidate = new URLSearchParams(location.search).get('provider');
const key = Object.hasOwn(providers, candidate) ? candidate : 'coinbase';
const provider = providers[key];
document.querySelectorAll('[data-provider]').forEach(node => { node.textContent = provider.name; });
const continueLink = document.getElementById('continue-setup');
if (continueLink) {
  continueLink.href = `https://onboard.mybluefinancial.com/?provider=${key}`;
  if (key === 'walletconnect') {
    document.querySelector('[data-create-title]').textContent = 'Bring your existing wallet.';
    document.querySelector('[data-create-copy]').textContent = 'Sign in with your existing wallet through Privy. Approve the connection and the separate login challenge. You will not need to create another wallet.';
  }
}
const previewButton = document.getElementById('preview-provider');
if (previewButton) {
  previewButton.textContent = `Preview ${key === 'walletconnect' ? 'wallet connection' : provider.name + ' funding'} →`;
  if (key === 'walletconnect') {
    document.querySelector('[data-setup-title]').textContent = 'Your existing wallet';
    document.querySelector('[data-setup-copy]').textContent = 'Once enabled, WalletConnect will let you select and connect your wallet. MyBlue account verification remains a separate step.';
    document.getElementById('fund-later').textContent = 'Explore the account overview';
  }
  previewButton.addEventListener('click', () => {
    document.getElementById('setup-status').textContent = provider.next + ' This handoff is not enabled yet.';
  });
  document.getElementById('fund-later').addEventListener('click', () => {
    document.getElementById('setup-status').textContent = 'Funding is optional. Your account overview will appear after verified sign-in and wallet setup. This preview contains no personal account, balance, or deposit.';
  });
}
