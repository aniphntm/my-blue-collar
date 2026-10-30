#!/usr/bin/env node
// Dependency-free policy scan for apps/mobile source.
// Fails (exit 1) on out-of-scope feature terms (mainnet, Plaid, ACH, USD/USDC,
// payment cards, private keys, seed phrases) and on hard-coded secrets.
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SKIP_DIRS = new Set(["node_modules", ".expo", "dist", "web-build", ".git", ".claude"]);
// Only these top-level directories are skipped (not at any depth).
const SKIP_TOP = new Set(["scripts", "assets"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"]);
const SKIP_FILES = new Set(["package-lock.json"]);

const FORBIDDEN = [
  ["mainnet", /mainnet/i],
  ["Plaid", /\bplaid\b/i],
  ["ACH", /\bach\b/i],
  ["USD/USDC/USDT", /\bus[dt]c?\b/i],
  ["payment card", /\b(credit|debit|payment|bank)[\s_-]?cards?\b|\bcard[\s_-]?(number|payment)s?\b|\bcvv\b|\bapple[\s_-]?pay\b|\bgoogle[\s_-]?pay\b/i],
  ["private key", /private[\s_-]?keys?|\bprivkey\b/i],
  ["seed phrase", /seed[\s_-]?phrases?|\bmnemonic\b|recovery[\s_-]?phrases?/i],
];

// Narrow allowlist: only explicit "never ..." safety copy. Matched spans are
// removed from a line before the forbidden-term check.
const ALLOW = [
  /\bnever\s+(?:asks?|enter|share|type|paste)\b[^.\n"'`<]*?(?:seed phrase|private key|recovery phrase)(?:\s+or\s+(?:a\s+)?(?:seed phrase|private key|recovery phrase))?/gi,
];

const SECRETS = [
  ["private key (64 hex)", /\b0x[0-9a-fA-F]{64}\b/],
  ["PEM private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ["API secret key (sk-)", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["Infura key in URL", /infura\.io\/(?:ws\/)?v3\/[0-9a-f]{16,}/i],
  ["Alchemy key in URL", /alchemy(?:api)?\.(?:com|io)\/v2\/[A-Za-z0-9_-]{16,}/i],
  ["credentials in URL", /\bhttps?:\/\/[^\s/:@"']+:[^\s/@"']+@/i],
  ["Reown project ID literal", /REOWN_PROJECT_ID["'\s:=]+["'`]?[0-9a-f]{32}\b/i],
  ["hard-coded secret assignment", /\b[\w.]*(?:secret|api[_-]?key|access[_-]?token|auth[_-]?token|password)[\w.]*["']?\s*[:=]\s*["'`][A-Za-z0-9_\-+/=]{16,}["'`]/i],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = lstatSync(full); // do not follow symlinks (avoids cycles)
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name) || (dir === root && SKIP_TOP.has(name))) continue;
      yield* walk(full);
    } else if ((EXTS.has(extname(name)) || name === ".env" || name.startsWith(".env.")) && !SKIP_FILES.has(name)) {
      yield full;
    }
  }
}

const findings = [];
let files = 0;
for (const file of walk(root)) {
  files++;
  const rel = relative(root, file).split(sep).join("/");
  readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
    let scrubbed = line;
    for (const re of ALLOW) scrubbed = scrubbed.replace(re, " ");
    for (const [label, re] of FORBIDDEN) {
      if (re.test(scrubbed)) findings.push(`${rel}:${i + 1} forbidden term (${label})`);
    }
    for (const [label, re] of SECRETS) {
      if (re.test(line)) findings.push(`${rel}:${i + 1} possible hard-coded secret (${label})`);
    }
  });
}

if (findings.length) {
  console.error(`scan failed: ${findings.length} finding(s)`);
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`scan passed: ${files} file(s) checked`);
