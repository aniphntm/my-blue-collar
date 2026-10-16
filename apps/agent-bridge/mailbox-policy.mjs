import { BridgeError } from './core.mjs';

// Call only with server-loaded membership/grant records and a verified actor.
// Provider inbox metadata and request-supplied approvals are not authority.
export function authorizeMailbox({ inboxId, action, actor, members, grants, approverUserIds, now = Date.now() }) {
  const denied = () => { throw new BridgeError(403, 'An active approved mailbox grant is required.'); };
  if (!inboxId || !['read', 'draft', 'send'].includes(action) || !Number.isFinite(now)) return denied();
  const member = members.find(m => m.agent_id === actor.agentId && m.owner_user_id === actor.userId && m.active === true);
  if (!member) return denied();
  const grant = grants.find(g => g.inbox_id === inboxId && g.agent_id === actor.agentId &&
    g.owner_user_id === actor.userId && g.approved === true && !g.revoked_at &&
    approverUserIds.includes(g.approved_by_user_id) &&
    Number.isFinite(Date.parse(g.approved_at)) && Date.parse(g.approved_at) <= now &&
    (g.expires_at == null || (Number.isFinite(Date.parse(g.expires_at)) && Date.parse(g.expires_at) > now)) &&
    Array.isArray(g.capabilities) && g.capabilities.includes(action));
  if (!grant) return denied();
  return { grant_id: grant.id, agent_id: member.agent_id, inbox_id: inboxId, action };
}
