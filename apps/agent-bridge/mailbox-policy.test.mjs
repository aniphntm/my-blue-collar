import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeMailbox } from './mailbox-policy.mjs';

const now = Date.parse('2026-10-16T03:00:00Z');
const base = {
  now, inboxId: 'shared@example.test', action: 'read',
  actor: { userId: 'fixture-owner', agentId: 'mira' },
  members: [{ agent_id: 'mira', owner_user_id: 'fixture-owner', active: true }],
  approverUserIds: ['fixture-admin'],
  grants: [{ id: 'fixture-grant', inbox_id: 'shared@example.test', agent_id: 'mira',
    owner_user_id: 'fixture-owner', approved: true, approved_by_user_id: 'fixture-admin',
    approved_at: '2026-10-16T02:00:00Z', expires_at: null, revoked_at: null, capabilities: ['read'] }],
};

test('shared inbox defaults to denied; a read grant cannot send or draft', () => {
  assert.throws(() => authorizeMailbox({ ...base, grants: [] }), /grant/);
  assert.equal(authorizeMailbox(base).grant_id, 'fixture-grant');
  for (const action of ['send', 'draft']) assert.throws(() => authorizeMailbox({ ...base, action }), /grant/);
});

test('revocation, expiry, membership removal, other agents and false approvals deny access', () => {
  for (const changes of [
    { revoked_at: '2026-10-16T02:30:00Z' },
    { expires_at: '2026-10-16T03:00:00Z' },
    { expires_at: 'invalid' },
    { approved_at: '2026-10-17T03:00:00Z' },
    { approved: false },
    { approved_by_user_id: 'unapproved-admin' },
    { owner_user_id: 'another-owner' },
  ]) assert.throws(() => authorizeMailbox({ ...base, grants: [{ ...base.grants[0], ...changes }] }), /grant/);
  assert.throws(() => authorizeMailbox({ ...base, members: [] }), /grant/);
  assert.throws(() => authorizeMailbox({ ...base, actor: { ...base.actor, agentId: 'stacy' } }), /grant/);
  assert.throws(() => authorizeMailbox({ ...base, inboxId: 'other@example.test' }), /grant/);
});
