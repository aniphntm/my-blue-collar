import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export class BridgeError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const slug = /^[a-z][a-z0-9_-]{1,63}$/;
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
export function validateOrg(config) {
  if (config.schema_version !== 1 || config.headcount_cap !== 20 || config.leader_count !== 5)
    throw new BridgeError(503, 'Invalid organization mechanics.');
  const mix = config.information_mix;
  const shares = ['user_work', 'internal_agent_network', 'public_social'].map(k => mix?.[k]);
  if (shares.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) ||
      Math.abs(shares.reduce((a, b) => a + b, 0) - 1) > 1e-9 ||
      typeof mix.public_social_cap !== 'number' || !Number.isFinite(mix.public_social_cap) ||
      mix.public_social_cap < 0 || mix.public_social_cap > 1 || shares[2] > mix.public_social_cap)
    throw new BridgeError(503, 'Invalid information mix.');
  if (config.memory?.write_policy !== 'explicit_remember_tool_call' ||
      config.memory?.recall_policy !== 'explicit_recall_tool_call')
    throw new BridgeError(503, 'Explicit memory policies are required.');
  if (!Array.isArray(config.leaders) || !config.leaders.length || config.leaders.length > config.leader_count)
    throw new BridgeError(503, 'Configure verified agent-to-user mappings first.');
  const ids = new Set();
  for (const agent of config.leaders) {
    if (!slug.test(agent.agent_id) || !slug.test(agent.domain_id) || !uuid.test(agent.owner_user_id) || ids.has(agent.agent_id))
      throw new BridgeError(503, 'Invalid or duplicate agent mapping.');
    ids.add(agent.agent_id);
  }
  return config;
}

export function ownedAgent(config, principal, agentId) {
  const agent = config.leaders.find(a => a.agent_id === agentId);
  if (!agent || agent.owner_user_id !== principal.userId ||
      (principal.agentId && principal.agentId !== agentId))
    throw new BridgeError(403, 'This agent is outside your scope.');
  return agent;
}

// Same own-versus-mean-others mixing used by SocialJax TRANSFER.
// This previews a reward; it neither runs SocialJax nor trains a hosted model.
export function mixedReward(own, others, selfInterest) {
  if (![own, selfInterest, ...others].every(Number.isFinite) || !others.length || selfInterest < 0 || selfInterest > 1)
    throw new BridgeError(400, 'Provide finite rewards and self-interest between zero and one.');
  return selfInterest * own + (1 - selfInterest) * others.reduce((a, b) => a + b, 0) / others.length;
}

export function contextBudget(config, total) {
  if (!Number.isSafeInteger(total) || total < 1 || total > 1000000) throw new BridgeError(400, 'Invalid token budget.');
  const m = config.information_mix;
  const user = Math.floor(total * m.user_work), internal = Math.floor(total * m.internal_agent_network);
  const publicCount = Math.floor(total * m.public_social);
  return { user_work: user, internal_agent_network: internal, public_social: publicCount,
    unused: total - user - internal - publicCount };
}

function text(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 8000)
    throw new BridgeError(400, 'Text must contain 1–8000 characters.');
  return value.trim();
}

export class BridgeStore {
  constructor(path, config) {
    this.config = validateOrg(config);
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS agent_bindings (
        agent TEXT PRIMARY KEY, owner TEXT NOT NULL, domain TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY, sender TEXT NOT NULL, recipient TEXT NOT NULL,
        body TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS letters (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL, agent TEXT NOT NULL, domain TEXT NOT NULL,
        request_key TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, digest_id TEXT,
        UNIQUE(owner, agent, domain, request_key));
      CREATE TABLE IF NOT EXISTS digests (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL, agent TEXT NOT NULL, domain TEXT NOT NULL,
        content TEXT NOT NULL, source_ids TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS letters_scope ON letters(owner, agent, domain, created_at);
      CREATE INDEX IF NOT EXISTS messages_recipient ON messages(recipient, created_at);`);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const agent of config.leaders) {
        const old = this.db.prepare('SELECT owner, domain FROM agent_bindings WHERE agent=?').get(agent.agent_id);
        if (old && (old.owner !== agent.owner_user_id || old.domain !== agent.domain_id))
          throw new BridgeError(503, 'Agent ownership changed; review a data migration before starting.');
        this.db.prepare('INSERT OR IGNORE INTO agent_bindings VALUES (?, ?, ?)')
          .run(agent.agent_id, agent.owner_user_id, agent.domain_id);
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); this.db.close(); throw error; }
  }
  close() { this.db.close(); }
  send(principal, input) {
    const from = ownedAgent(this.config, principal, input.from_agent);
    if (!this.config.leaders.some(a => a.agent_id === input.to_agent)) throw new BridgeError(400, 'Unknown recipient.');
    const id = randomUUID(), now = new Date().toISOString();
    this.db.prepare('INSERT INTO messages VALUES (?, ?, ?, ?, ?)').run(id, from.agent_id, input.to_agent, text(input.text), now);
    return { id, created_at: now };
  }
  inbox(principal, agentId) {
    ownedAgent(this.config, principal, agentId);
    return this.db.prepare('SELECT * FROM messages WHERE recipient=? ORDER BY created_at DESC, id LIMIT 50').all(agentId);
  }
  remember(principal, input) {
    const agent = ownedAgent(this.config, principal, input.agent_id);
    if (input.intent !== 'remember') throw new BridgeError(400, 'Explicit remember intent is required.');
    if (typeof input.idempotency_key !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.idempotency_key))
      throw new BridgeError(400, 'Provide a stable 16–100 character idempotency key.');
    const body = text(input.text);
    const scope = [principal.userId, agent.agent_id, agent.domain_id, input.idempotency_key];
    const id = randomUUID();
    const result = this.db.prepare('INSERT OR IGNORE INTO letters VALUES (?, ?, ?, ?, ?, ?, ?, NULL)')
      .run(id, ...scope, body, new Date().toISOString());
    const saved = this.db.prepare('SELECT id, body FROM letters WHERE owner=? AND agent=? AND domain=? AND request_key=?').get(...scope);
    if (saved.body !== body) throw new BridgeError(409, 'That request key already saved a different letter.');
    return { id: saved.id, duplicate: result.changes === 0 };
  }
  recall(principal, input) {
    const a = ownedAgent(this.config, principal, input.agent_id);
    const terms = text(input.query).toLocaleLowerCase().match(/[\p{L}\p{N}_-]+/gu)?.slice(0, 20) ?? [];
    // Bound literal text terms; letters remain source records, never executable instructions.
    const clauses = terms.map(() => 'instr(lower(body), ?) > 0');
    return this.db.prepare(`SELECT id, body, created_at, digest_id FROM letters
      WHERE owner=? AND agent=? AND domain=? AND (${clauses.join(' OR ') || '0'})
      ORDER BY created_at DESC, id LIMIT 20`).all(principal.userId, a.agent_id, a.domain_id, ...terms);
  }
  consolidate(principal, agentId) {
    const a = ownedAgent(this.config, principal, agentId), scope = [principal.userId, a.agent_id, a.domain_id];
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const letters = this.db.prepare(`SELECT id, body FROM letters WHERE owner=? AND agent=? AND domain=?
        AND digest_id IS NULL ORDER BY created_at, id LIMIT 40`).all(...scope);
      if (!letters.length) { this.db.exec('COMMIT'); return { processed: 0 }; }
      const id = randomUUID();
      // Extractive batch digest. Originals are retained; no invented facts or cross-agent rollup.
      const content = letters.map(l => `[${l.id}] ${l.body.slice(0, 240)}`).join('\n');
      this.db.prepare('INSERT INTO digests VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, ...scope, content, JSON.stringify(letters.map(l => l.id)), new Date().toISOString());
      const mark = this.db.prepare('UPDATE letters SET digest_id=? WHERE id=? AND digest_id IS NULL');
      for (const letter of letters) mark.run(id, letter.id);
      this.db.exec('COMMIT');
      return { id, processed: letters.length, content, source_ids: letters.map(l => l.id), method: 'extractive' };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}
