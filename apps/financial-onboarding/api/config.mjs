export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ appId: process.env.PRIVY_APP_ID || null });
}
