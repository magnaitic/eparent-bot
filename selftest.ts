// Offline sanity check: confirms the crypto round-trips and prints the derived key.
import { encrypt, decrypt, KEY_HEX } from './src/crypto.ts';

const sample = JSON.stringify({ hello: 'world', n: 42 });
const ct = encrypt(sample);
const rt = decrypt(ct);

console.log('Derived AES key (hex):', KEY_HEX);
console.log('Plaintext :', sample);
console.log('Ciphertext:', ct);
console.log('Round-trip:', rt);
console.log(rt === sample ? '✓ crypto OK' : '✗ crypto MISMATCH');
process.exit(rt === sample ? 0 : 1);
