// Renews the access token via auth/refresh, using the saved token + refreshToken.
// Mirrors the app: POST { token, refreshToken } -> new token (refreshToken rotates if returned).
//
// Usage: npm run refresh
import { readFileSync, writeFileSync } from 'node:fs';
import { apiPost } from './src/client.ts';
import type { Session } from './src/api.ts';

const tokenUrl = new URL('./token.json', import.meta.url);
let saved: Session;
try { saved = JSON.parse(readFileSync(tokenUrl, 'utf8')); }
catch { console.error('No token.json — run `npm run login` first.'); process.exit(1); }

const { token, refreshToken, env = 'prod' } = saved;
if (!token || !refreshToken) {
  console.error('token.json is missing token or refreshToken — log in again.');
  process.exit(1);
}

console.log(`POST auth/refresh  (env=${env})`);
const r = await apiPost('auth/refresh', { token, refreshToken }, { env });
console.log('HTTP', r.status);
console.log(JSON.stringify(r.data ?? r.raw, null, 2));

const d = r.data || {};
const newToken = d.token || d?.data?.token;
if (newToken) {
  const newRefresh = d.refreshToken || d?.data?.refreshToken || refreshToken; // keep old if not rotated
  writeFileSync(tokenUrl, JSON.stringify({ token: newToken, refreshToken: newRefresh, env }, null, 2));
  console.log('\n✓ token.json updated with the new access token.');
} else {
  console.log('\n(no new token returned — refresh token may be expired; log in again.)');
}
