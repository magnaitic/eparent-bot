// High-level eParent API helpers. All calls are authenticated with the saved token.
import { readFileSync } from 'node:fs';
import { apiPost } from './client.mjs';

export function loadSession() {
  try {
    const s = JSON.parse(readFileSync(new URL('./../token.json', import.meta.url)));
    if (!s.token) throw new Error('no token');
    return s; // { token, refreshToken, env }
  } catch {
    throw new Error('No token.json — run `npm run login` first.');
  }
}

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const DEVICE = 'Pixel 8';

// Each helper returns the decrypted response object.
export const api = (s) => ({
  // parent profile + list of children ({ students: [...] })
  init: () => apiPost('main/init', { device: DEVICE }, s),

  // per-student
  home: (student, date = today()) => apiPost('main/home', { student, date, device: DEVICE }, s),
  studentInfo: (id) => apiPost('student/info', { id }, s),

  attendance: (student, season, type = 'DAY', date = today()) =>
    apiPost('attendance/index', { student, season, type, date }, s),
  attendanceDetail: (student, season, date = today()) =>
    apiPost('attendance/detail', { student, season, date }, s),

  homework: (student, season, type = '') =>
    apiPost('homework/index', { student, season, type }, s),

  timetable: (student, index = 0) =>
    apiPost('timetable/weekly', { student, index }, s),

  exams: (student, season) => apiPost('exam/index', { season, student }, s),
  examResult: (student, season) => apiPost('exam/result', { season, student }, s),

  notifications: () => apiPost('notification/index', {}, s),
});

// bind helpers to the saved session
export function apiFromSession() {
  const s = loadSession();
  return { session: s, api: api({ env: s.env || 'prod', token: s.token }) };
}
