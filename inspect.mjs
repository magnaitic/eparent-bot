// Offline: decodes the saved access + refresh tokens (if they are JWTs) and prints
// issued-at / expiry / computed lifetime. No network.
// Usage: npm run inspect
import { readFileSync } from 'node:fs';

let saved;
try { saved = JSON.parse(readFileSync(new URL('./token.json', import.meta.url))); }
catch { console.error('No token.json — run `npm run login` first.'); process.exit(1); }

function decodeJwt(name, tok) {
  console.log(`\n== ${name} ==`);
  if (!tok) { console.log('  (missing)'); return; }
  const parts = String(tok).split('.');
  if (parts.length !== 3) {
    console.log(`  not a JWT (length ${String(tok).length}, ${parts.length} segment(s)) — opaque token, lifetime is server-side only.`);
    return;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    console.log('  payload:', JSON.stringify(payload));
    const fmt = (s) => new Date(s * 1000).toISOString();
    if (payload.iat) console.log('  issued :', fmt(payload.iat));
    if (payload.exp) {
      console.log('  expires:', fmt(payload.exp));
      const secs = payload.exp - (payload.iat ?? Math.floor(Date.now() / 1000));
      const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), m = Math.floor((secs % 3600) / 60);
      console.log(`  lifetime: ${secs}s  (~${d}d ${h}h ${m}m)`);
      console.log(payload.exp * 1000 < Date.now() ? '  STATUS: EXPIRED' : '  STATUS: valid');
    } else {
      console.log('  no exp claim — does not expire by time (server may still revoke it).');
    }
  } catch (e) {
    console.log('  could not decode payload:', e.message);
  }
}

decodeJwt('access token', saved.token);
decodeJwt('refresh token', saved.refreshToken);
