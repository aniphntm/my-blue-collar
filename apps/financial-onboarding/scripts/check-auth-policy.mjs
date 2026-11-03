import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = process.argv[2] || '.';
async function scan(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'tests'].includes(entry.name) || entry.name === 'README.md' || entry.name === 'check-auth-policy.mjs') continue;
    const file = join(path, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.(?:m?js|tsx?|html|json)$/.test(file)) {
      const source = await readFile(file, 'utf8');
      if (/@privy-io|privy\.io|PRIVY_APP|privy-auth/i.test(source)) throw new Error(`Retired auth reference: ${file}`);
    }
  }
}
await scan(root);
console.log('Retired authentication dependency check passed');
