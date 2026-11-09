// Logs in to eParent with username/password and saves the session token to token.json.
//
// Usage:
//   npm run login
//
// Put your credentials below. NOTE: this file is NOT git-ignored, so don't commit it
// with real credentials (or move USERNAME/PASSWORD into .env, which is ignored).
import { writeFileSync } from 'node:fs';
import { apiPost } from './src/client.mjs';

// ---- EDIT THESE ----
const USERNAME = '**';
const PASSWORD = '**';
const env = 'prod'; // 'prod' or 'test'
// --------------------

const username = USERNAME;
const password = PASSWORD;

// Stable device identity (ANDROID_ID is 16 hex chars). Keep these fixed across runs,
// like a real device would. Regenerate with: node gen-ids.mjs
const DEVICE = 'Pixel 8';
const UNIQUE_ID = 'cac193478b17d8f9';

const payload = {
  username,
  password,
  device: DEVICE,
  uniqueId: UNIQUE_ID,
};

console.log(`\nPOST auth/login  (env=${env})`);
const r = await apiPost('auth/login', payload, { env });
console.log('HTTP', r.status);
console.log('\nResponse:');
console.log(JSON.stringify(r.data ?? r.raw, null, 2));

// Try common token locations (access + refresh)
const d = r.data || {};
const token = d.token || d.accessToken || d?.data?.token || d?.user?.token;
const refreshToken = d.refreshToken || d?.data?.refreshToken || d?.user?.refreshToken || null;
if (token) {
  writeFileSync(new URL('./token.json', import.meta.url),
    JSON.stringify({ token, refreshToken, env }, null, 2));
  console.log('\n✓ Saved token.json (access' + (refreshToken ? ' + refresh' : '') + ') — use:  npm run call -- main/home');
  if (!refreshToken) console.log('  (no refreshToken in response — check the shape above; renew with `npm run refresh` once we know the field)');
} else {
  console.log('\n(no token field found — check the response shape above)');
}
