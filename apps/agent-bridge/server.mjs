import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { BridgeError, BridgeStore, contextBudget, mixedReward } from './core.mjs';
import { ConcordiaRouter } from './concordia-router.mjs';

const { values } = parseArgs({ options: { 'org-chart': { type: 'string' }, db: { type: 'string' }, port: { type: 'string', default: '8787' } } });
if (!values['org-chart'] || !values.db) throw new Error('Pass --org-chart PATH and --db PATH. Use a persistent disk.');
const config = JSON.parse(readFileSync(values['org-chart'], 'utf8'));
const store = new BridgeStore(values.db, config);
const router = new ConcordiaRouter(store, { mailbox: config.mailbox ?? {}, wallets: config.wallets ?? [] });
const authUrl = process.env.BRIDGE_SUPABASE_URL;
if (!authUrl || new URL(authUrl).protocol !== 'https:' || !process.env.BRIDGE_SUPABASE_PUBLISHABLE_KEY)
  throw new Error('Configure the current project HTTPS URL and publishable key; no auth bypass is available.');

async function principal(request) {
  const authorization = request.headers.authorization;
  if (!/^Bearer [^\s]+$/.test(authorization ?? '')) throw new BridgeError(401, 'Sign in with your existing user account.');
  const response = await fetch(`${new URL(authUrl).origin}/auth/v1/user`, {
    headers: { authorization, apikey: process.env.BRIDGE_SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(8000), redirect: 'error',
  });
  if (!response.ok) throw new BridgeError(response.status === 401 || response.status === 403 ? 401 : 503, 'User verification unavailable.');
  const user = await response.json();
  if (!user.id || user.is_anonymous || !config.leaders.some(a => a.owner_user_id === user.id))
    throw new BridgeError(403, 'No approved agent mapping for this user.');
  return { userId: user.id };
}

createServer(async (request, response) => {
  const reply = (status, data) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff' });
    response.end(JSON.stringify(data));
  };
  try {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/health') return reply(200, { status: 'ready', auth: 'required' });
    const actor = await principal(request);
    if (request.method === 'GET' && url.pathname === '/agents') return reply(200, {
      agents: config.leaders.filter(a => a.owner_user_id === actor.userId).map(a => ({ agent_id: a.agent_id, domain_id: a.domain_id })),
      context_budget: contextBudget(config, 10000),
    });
    if (request.method === 'GET' && url.pathname === '/concordia/observations') return reply(200, { observations: router.observations(actor, url.searchParams.get('agent_id')) });
    if (request.method === 'GET' && url.pathname === '/concordia/outbox') return reply(200, { commands: router.outbox(actor, url.searchParams.get('agent_id')) });
    if (request.method === 'GET' && url.pathname === '/inbox') return reply(200, { messages: store.inbox(actor, url.searchParams.get('agent_id')) });
    if (request.method !== 'POST') return reply(405, { error: 'Use an implemented GET or POST endpoint.' });
    if (!request.headers['content-type']?.startsWith('application/json')) throw new BridgeError(415, 'Use application/json.');
    let body = '';
    for await (const chunk of request) {
      body += chunk;
      if (Buffer.byteLength(body) > 16000) throw new BridgeError(413, 'Request too large.');
    }
    const input = JSON.parse(body);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BridgeError(400, 'Invalid request.');
    const path = url.pathname;
    if (path === '/concordia/ingest') return reply(201, router.ingest(actor, input));
    if (path === '/concordia/commands') return reply(201, router.command(actor, input));
    if (path === '/concordia/approve') return reply(200, router.approve(actor, input));
    if (path === '/concordia/acknowledge') return reply(200, router.acknowledge(actor, input));
    if (path === '/messages') return reply(201, store.send(actor, input));
    if (path === '/letters') return reply(200, store.remember(actor, input));
    if (path === '/recall') return reply(200, { matches: store.recall(actor, input), method: 'literal_term_search' });
    if (path === '/consolidate') return reply(200, store.consolidate(actor, input.agent_id));
    if (path === '/reward-preview') {
      if (!Array.isArray(input.others)) throw new BridgeError(400, 'Provide other-agent rewards.');
      return reply(200, { reward: mixedReward(input.own, input.others, input.self_interest),
        method: 'transfer_reward_formula', socialjax_executed: false, model_weights_updated: false });
    }
    return reply(404, { error: 'Unknown endpoint.' });
  } catch (error) {
    reply(error instanceof BridgeError ? error.status : error instanceof SyntaxError ? 400 : 503,
      { error: error instanceof BridgeError ? error.message : 'Request failed; no provider details exposed.' });
  }
}).listen(Number(values.port), '127.0.0.1', () => {
  console.log(`Agent bridge listening on http://127.0.0.1:${values.port}. Use a TLS reverse proxy for network access.`);
});
