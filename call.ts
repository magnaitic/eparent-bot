// Calls any endpoint using the saved token. Payload is optional JSON.
//
// Usage:
//   npm run call -- <path> [jsonPayload]
// Examples:
//   npm run call -- main/home
//   npm run call -- student/info '{"studentId":123}'
//   npm run call -- attendance/index '{"month":"2026-11"}'
import { readFileSync } from 'node:fs';
import { apiPost, type Env } from './src/client.ts';

const path = process.argv[2];
if (!path) {
  console.error('Usage: npm run call -- <path> [jsonPayload]');
  process.exit(1);
}
let payload: unknown = {};
if (process.argv[3]) {
  try { payload = JSON.parse(process.argv[3]); }
  catch (e) { console.error('Bad JSON payload:', (e as Error).message); process.exit(1); }
}

let token: string | null = null, env: Env = 'prod';
try {
  const t = JSON.parse(readFileSync(new URL('./token.json', import.meta.url), 'utf8'));
  token = t.token; env = t.env || 'prod';
} catch {
  console.error('No token.json — run `npm run login` first.');
  process.exit(1);
}

console.log(`POST ${path}  (env=${env}, authed)`);
const r = await apiPost(path, payload, { env, token });
console.log('HTTP', r.status);
console.log(JSON.stringify(r.data ?? r.raw, null, 2));
