export const origin = 'https://mybluefinancial.com';
export const env = { AUTH_ORIGIN: origin };
export function response() { return { headers: {}, code: 200, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; } }; }
export function req(method = 'GET', body, cookie = '', headers = {}) { return { method, body, headers: { host: 'mybluefinancial.com', origin, 'content-type': 'application/json', cookie, ...headers } }; }
export async function run(handler, request) { const res = response(); await handler(request, res); return res; }
export function memoryStore() {
  const records = new Map();
  return {
    records, async allow() { return true; },
    async get(id) { return structuredClone(records.get(id) ?? null); },
    async put(id, value) { records.set(id, structuredClone(value)); },
    async remove(id) { records.delete(id); },
    async replace(id, expected, next) {
      if (JSON.stringify(records.get(id)) !== JSON.stringify(expected)) return false;
      records.set(id, structuredClone(next)); return true;
    },
  };
}
