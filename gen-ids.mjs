// Prints a fresh device name + ANDROID_ID-style uniqueId. Paste into login.mjs.
import { randomBytes } from 'node:crypto';

const models = ['Pixel 7', 'Pixel 8', 'Pixel 9', 'SM-G991B', 'SM-A546E', 'SM-S918B', 'Redmi Note 12', 'Redmi Note 13'];
const device = models[Math.floor(Math.random() * models.length)];
const uniqueId = randomBytes(8).toString('hex'); // 16 hex chars, like Android's getUniqueId()

console.log(`const DEVICE = '${device}';`);
console.log(`const UNIQUE_ID = '${uniqueId}';`);
