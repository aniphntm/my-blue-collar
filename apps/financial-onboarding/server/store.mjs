import { createHash } from 'node:crypto';

// No process-local production fallback: all instances must share revocation/replay state.
export function createStore(env = process.env, fetchImpl = globalThis.fetch) {
  const endpoint = env.AUTH_REDIS_REST_URL;
  if (!endpoint || !env.AUTH_REDIS_REST_TOKEN) throw new Error('Session store unavailable');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.origin !== endpoint || url.username || url.password) throw new Error('Invalid store URL');
  async function command(args) {
    const response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${env.AUTH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    if (!response.ok) throw new Error('Session store unavailable');
    const data = await response.json();
    if (data.error || !Object.hasOwn(data, 'result')) throw new Error('Session store unavailable');
    return data.result;
  }
  const key = token => `myblue:auth:v1:${createHash('sha256').update(token).digest('hex')}`;
  return {
    async get(token) { const value = await command(['GET', key(token)]); return value === null ? null : JSON.parse(value); },
    async put(token, value, ttl) { if (await command(['SET', key(token), JSON.stringify(value), 'EX', ttl, 'NX']) !== 'OK') throw new Error('Session collision'); },
    async remove(token) { await command(['DEL', key(token)]); },
    async replace(token, expected, value, ttl) {
      // Compare-and-swap makes signature consumption atomic across workers. Cancellation wins if it deleted the challenge first.
      const script = "if redis.call('GET',KEYS[1]) == ARGV[1] then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1 else return 0 end";
      return await command(['EVAL', script, 1, key(token), JSON.stringify(expected), JSON.stringify(value), ttl]) === 1;
    },
    async allow(origin) {
      // Bounded public challenge issuance, including clients that discard cookies. Add deployment-level per-client limits before release.
      const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n";
      return await command(['EVAL', script, 1, `myblue:auth:rate:${createHash('sha256').update(origin).digest('hex')}`]) <= 120;
    },
  };
}
