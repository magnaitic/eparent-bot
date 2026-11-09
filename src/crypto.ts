// AES-256-CBC body crypto, reproduced from the eParent Hermes bundle.
//   key = PBKDF2(password="ESCHOOL_EPARENT", salt, iterations=999, SHA-512, 256-bit)
//   iv  = fixed 16 bytes
//   payload is AES-encrypted, base64 of the raw ciphertext is sent as { data: <b64> }
import CryptoJS from 'crypto-js';

const PASSWORD = 'ESCHOOL_EPARENT';
const SALT = CryptoJS.enc.Hex.parse('3536373334653339353535373731373635363466');
const IV   = CryptoJS.enc.Hex.parse('36333532333137383339353937383431');

const KEY = CryptoJS.PBKDF2(PASSWORD, SALT, {
  keySize: 8,            // 8 words * 32 bits = 256-bit key
  iterations: 999,
  hasher: CryptoJS.algo.SHA512,
});

export const KEY_HEX = KEY.toString(CryptoJS.enc.Hex);

/** Encrypt a plaintext string -> base64 ciphertext (what goes in `data`). */
export function encrypt(plaintext) {
  const enc = CryptoJS.AES.encrypt(plaintext, KEY, { iv: IV });
  return enc.ciphertext.toString(CryptoJS.enc.Base64);
}

/** Decrypt a base64 ciphertext string -> plaintext. */
export function decrypt(b64) {
  const dec = CryptoJS.AES.decrypt(b64, KEY, { iv: IV });
  return dec.toString(CryptoJS.enc.Utf8);
}

/** Convenience: encrypt an object as JSON. */
export const encryptJson = (obj) => encrypt(JSON.stringify(obj));
/** Convenience: decrypt to an object. */
export const decryptJson = (b64) => JSON.parse(decrypt(b64));
