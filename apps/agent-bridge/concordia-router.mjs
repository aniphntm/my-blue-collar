import { randomUUID } from 'node:crypto';
import { BridgeError, ownedAgent } from './core.mjs';
import { authorizeMailbox } from './mailbox-policy.mjs';

const keyPattern = /^[A-Za-z0-9_-]{16,100}$/;
const evmAddress = /^0x[a-fA-F0-9]{40}$/;
const mailboxIdPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inboundTypes = {
  mail: new Set(['mail.received', 'mail.delivered', 'mail.failed']),
  wallet: new Set(['wallet.balance_observed', 'wallet.transfer_confirmed', 'wallet.transfer_failed']),
};
const outboundTypes = {
  mail: new Set(['mail.draft', 'mail.send']),
  wallet: new Set(['wallet.transfer_request']),
};

function required(value, name, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\r\n]/.test(value))
    throw new BridgeError(400, `Invalid ${name}.`);
  return value.trim();
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const obj = {};
    for (const key of Object.keys(value).sort()) {
      if (/private.?key|secret|seed.?phrase|mnemonic|signed.?tx|authorization|password/i.test(key))
        throw new BridgeError(400, 'Secret or signed transaction fields are forbidden.');
      obj[key] = stable(value[key]);
    }
    return obj;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) throw new BridgeError(400, 'Invalid numeric value.');
  return value;
}
function safeData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new BridgeError(400, 'Data must be an object.');
  const cleaned = stable(data);
  if (JSON.stringify(cleaned).length > 8000) throw new BridgeError(413, 'Event payload too large.');
  return cleaned;
}
function validateMoney(payload) {
  if (!evmAddress.test(required(payload.to, 'wallet destination', 42)) ||
      !/^[1-9][0-9]*$/.test(String(payload.amount_base_units)) ||
      String(payload.amount_base_units).length > 78 ||
      !/^[A-Za-z0-9_.-]{1,32}$/.test(payload.asset_id ?? ''))
    throw new BridgeError(400, 'Use an EVM destination, positive integer base units and an asset id.');
  if (payload.calldata || payload.private_key || payload.signed_transaction)
    throw new BridgeError(400, 'Only unsigned, declarative transfer requests are allowed.');
  return {
    to: payload.to.toLowerCase(),
    amount_base_units: String(payload.amount_base_units),
    asset_id: payload.asset_id,
  };
}

// Intentionally a routing and approval layer, not a mail client or a wallet signer.
// The external broker must authenticate separately and confirm provider outcomes.
export class ConcordiaRouter {
  constructor(store, { mailbox = {}, wallets = [] } = {}) {
    this.store = store;
    this.mailbox = mailbox;
    this.wallets = wallets;
    this.db = store.db;
    this.db.exec(`CREATE TABLE IF NOT EXISTS concordia_events (
       id TEXT PRIMARY KEY, owner TEXT NOT NULL, agent TEXT NOT NULL,
       channel TEXT NOT NULL, source TEXT NOT NULL, external_id TEXT NOT NULL,
       event_type TEXT NOT NULL, route_id TEXT NOT NULL, payload TEXT NOT NULL,
       created_at TEXT NOT NULL, UNIQUE(owner, agent, channel, source, external_id));
       CREATE TABLE IF NOT EXISTS concordia_commands (
       id TEXT PRIMARY KEY, owner TEXT NOT NULL, agent TEXT NOT NULL, channel TEXT NOT NULL,
       command_type TEXT NOT NULL, request_key TEXT NOT NULL, route_id TEXT NOT NULL,
       payload TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL,
       approved_at TEXT, acknowledged_at TEXT,
       UNIQUE(owner, agent, request_key));
       CREATE INDEX IF NOT EXISTS concordia_event_scope ON concordia_events(owner, agent, created_at);
       CREATE INDEX IF NOT EXISTS concordia_command_scope ON concordia_commands(owner, agent, status, created_at);`);
  }
  authorize(principal, input, capability) {
    const agent = ownedAgent(this.store.config, principal, input.agent_id);
    if (input.channel === 'mail') {
      const mailbox = typeof this.mailbox === 'function' ? this.mailbox() : this.mailbox;
      const inboxId = required(input.route_id, 'mailbox route');
      if (!mailboxIdPattern.test(inboxId)) throw new BridgeError(400, 'Invalid mailbox.');
      authorizeMailbox({
        inboxId, action: capability, actor: { userId: principal.userId, agentId: agent.agent_id },
        members: mailbox.members ?? [], grants: mailbox.grants ?? [],
        approverUserIds: mailbox.approver_user_ids ?? [],
      });
    } else if (input.channel === 'wallet') {
      const walletId = required(input.route_id, 'wallet route');
      const wallets = typeof this.wallets === 'function' ? this.wallets() : this.wallets;
      const bound = wallets.find(w => w.wallet_id === walletId && w.agent_id === agent.agent_id &&
        w.owner_user_id === principal.userId && w.active === true && evmAddress.test(w.address) &&
        Number.isSafeInteger(w.chain_id) && w.chain_id > 0 &&
        Array.isArray(w.capabilities) && w.capabilities.includes(capability));
      if (!bound) throw new BridgeError(403, 'No active scoped wallet binding.');
    } else throw new BridgeError(400, 'Unknown route channel.');
    return agent;
  }
  ingest(principal, input) {
    if (!inboundTypes[input.channel]?.has(input.event_type)) throw new BridgeError(400, 'Unsupported inbound event.');
    this.authorize(principal, input, 'read');
    const source = required(input.source, 'source');
    const externalId = required(input.external_id, 'external event ID');
    const payload = JSON.stringify(safeData(input.data));
    const scope = [principal.userId, input.agent_id, input.channel, source, externalId];
    const id = randomUUID();
    const now = new Date().toISOString();
    const change = this.db.prepare(`INSERT OR IGNORE INTO concordia_events
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, ...scope, input.event_type, input.route_id, payload, now);
    const existing = this.db.prepare(`SELECT id, event_type, route_id, payload FROM concordia_events
      WHERE owner=? AND agent=? AND channel=? AND source=? AND external_id=?`).get(...scope);
    if (existing.event_type !== input.event_type || existing.route_id !== input.route_id || existing.payload !== payload)
      throw new BridgeError(409, 'Source event ID already used for different content.');
    return { id: existing.id, duplicate: change.changes === 0, memory_written: false, provenance: 'authenticated_owner_submission' };
  }
  observations(principal, agentId) {
    ownedAgent(this.store.config, principal, agentId);
    return this.db.prepare(`SELECT id, channel, source, external_id, event_type, route_id, payload, created_at
      FROM concordia_events WHERE owner=? AND agent=? ORDER BY created_at DESC, id DESC LIMIT 100`)
      .all(principal.userId, agentId).map(e => ({
        id: e.id, kind: 'external_observation', actor_id: agentId,
        channel: e.channel, event_type: e.event_type, route_id: e.route_id,
        source_ref: `${e.source}:${e.external_id}`, data: JSON.parse(e.payload),
        provenance: 'authenticated_owner_submission', trust: 'untrusted_external_content', created_at: e.created_at,
      }));
  }
  command(principal, input) {
    if (!outboundTypes[input.channel]?.has(input.command_type)) throw new BridgeError(400, 'Unsupported outbound command.');
    const capability = input.command_type === 'mail.draft' ? 'draft' : input.channel === 'mail' ? 'send' : 'propose';
    this.authorize(principal, input, capability);
    if (!keyPattern.test(input.idempotency_key ?? '')) throw new BridgeError(400, 'Invalid idempotency key.');
    const raw = safeData(input.data);
    let payload;
    if (input.channel === 'mail') {
      const to = required(raw.to, 'recipient');
      if (!mailboxIdPattern.test(to)) throw new BridgeError(400, 'Invalid recipient.');
      const subject = required(raw.subject, 'subject');
      if (typeof raw.text !== 'string' || !raw.text.trim() || raw.text.length > 8000)
        throw new BridgeError(400, 'Invalid mail body.');
      payload = { to, subject, text: raw.text.trim() };
    } else payload = validateMoney(raw);
    const serialized = JSON.stringify(payload);
    const scope = [principal.userId, input.agent_id, input.idempotency_key];
    const status = input.command_type === 'mail.draft' ? 'queued' : 'pending_review';
    const id = randomUUID(), now = new Date().toISOString();
    const change = this.db.prepare(`INSERT OR IGNORE INTO concordia_commands
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`)
      .run(id, principal.userId, input.agent_id, input.channel, input.command_type,
        input.idempotency_key, input.route_id, serialized, status, now);
    const existing = this.db.prepare(`SELECT * FROM concordia_commands WHERE owner=? AND agent=? AND request_key=?`).get(...scope);
    if (existing.channel !== input.channel || existing.command_type !== input.command_type ||
        existing.route_id !== input.route_id || existing.payload !== serialized)
      throw new BridgeError(409, 'Command key already used for different content.');
    return { id: existing.id, status: existing.status, duplicate: change.changes === 0,
      external_action_executed: false };
  }
  approve(principal, { agent_id, command_id }) {
    ownedAgent(this.store.config, principal, agent_id);
    const row = this.db.prepare('SELECT * FROM concordia_commands WHERE id=? AND owner=? AND agent=?')
      .get(command_id, principal.userId, agent_id);
    if (!row) throw new BridgeError(404, 'Command not found.');
    if (row.status !== 'pending_review') throw new BridgeError(409, 'Command is not awaiting review.');
    this.authorize(principal, { agent_id, channel: row.channel, route_id: row.route_id },
      row.channel === 'mail' ? 'send' : 'propose');
    const status = row.channel === 'mail' ? 'queued' : 'awaiting_signature';
    this.db.prepare(`UPDATE concordia_commands SET status=?, approved_at=?
      WHERE id=? AND status='pending_review'`).run(status, new Date().toISOString(), row.id);
    return { id: row.id, status, external_action_executed: false,
      wallet_signature_required: row.channel === 'wallet' };
  }
  outbox(principal, agentId) {
    ownedAgent(this.store.config, principal, agentId);
    const rows = this.db.prepare(`SELECT id, channel, command_type, route_id, payload, status, created_at
      FROM concordia_commands WHERE owner=? AND agent=? AND status IN ('queued', 'awaiting_signature')
      ORDER BY created_at, id LIMIT 50`).all(principal.userId, agentId);
    // A revoked mailbox grant or wallet binding immediately hides queued commands.
    return rows.flatMap(row => {
      try {
        this.authorize(principal, { agent_id: agentId, channel: row.channel, route_id: row.route_id },
          row.command_type === 'mail.draft' ? 'draft' : row.channel === 'mail' ? 'send' : 'propose');
      } catch (e) { if (e instanceof BridgeError && e.status === 403) return []; throw e; }
      return [{ id: row.id, channel: row.channel, command_type: row.command_type,
        route_id: row.route_id, data: JSON.parse(row.payload), status: row.status,
        wallet_signature_required: row.channel === 'wallet', created_at: row.created_at }];
    });
  }
  acknowledge(principal, { agent_id, command_id, receipt_id }) {
    ownedAgent(this.store.config, principal, agent_id);
    const receipt = required(receipt_id, 'receipt ID');
    const row = this.db.prepare('SELECT * FROM concordia_commands WHERE id=? AND owner=? AND agent=?')
      .get(command_id, principal.userId, agent_id);
    if (!row) throw new BridgeError(404, 'Command not found.');
    if (row.channel === 'wallet') throw new BridgeError(409, 'Wallet confirmation must enter as an observed event, not a relay acknowledgement.');
    if (row.status === 'delivered') return { id: row.id, status: 'delivered', duplicate: true };
    if (row.status !== 'queued') throw new BridgeError(409, 'Command not ready for acknowledgement.');
    this.authorize(principal, { agent_id, channel: row.channel, route_id: row.route_id },
      row.command_type === 'mail.draft' ? 'draft' : 'send');
    this.db.prepare('UPDATE concordia_commands SET status=?, acknowledged_at=? WHERE id=? AND status=?')
      .run('delivered', new Date().toISOString(), row.id, 'queued');
    // Receipt is metadata only; it cannot prove provider delivery without broker verification.
    return { id: row.id, receipt_id: receipt, status: 'delivered', provider_delivery_verified: false };
  }
}
