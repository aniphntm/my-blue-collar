export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ authentication: 'wallet-signature', chainId: 8453, funding: 'paused' });
}
