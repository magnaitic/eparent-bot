// High-level eParent API helpers. All calls are authenticated with the saved token.
import { readFileSync } from 'node:fs';
import { apiPost, type Env, type RequestOptions } from './client.ts';

export interface Session {
  token: string;
  refreshToken: string | null;
  env?: Env;
}

export function loadSession(): Session {
  try {
    const s = JSON.parse(readFileSync(new URL('./../token.json', import.meta.url), 'utf8')) as Session;
    if (!s.token) throw new Error('no token');
    return s;
  } catch {
    throw new Error('No token.json — run `npm run login` first.');
  }
}

type Id = string | number;

const today = (): string => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const DEVICE = 'Pixel 8';

// Each helper returns the decrypted response object.
export const api = (s: RequestOptions) => ({
  // parent profile + list of children ({ students: [...] })
  init: () => apiPost('main/init', { device: DEVICE }, s),

  // per-student
  home: (student: Id, date = today()) => apiPost('main/home', { student, date, device: DEVICE }, s),
  studentInfo: (id: Id) => apiPost('student/info', { id }, s),

  attendance: (student: Id, season: Id, type = 'DAY', date = today()) =>
    apiPost('attendance/index', { student, season, type, date }, s),
  attendanceDetail: (student: Id, season: Id, date = today()) =>
    apiPost('attendance/detail', { student, season, date }, s),

  homework: (student: Id, season: Id, type = '') =>
    apiPost('homework/index', { student, season, type }, s),

  timetable: (student: Id, index = 0) =>
    apiPost('timetable/weekly', { student, index }, s),

  exams: (student: Id, season: Id) => apiPost('exam/index', { season, student }, s),
  examResult: (student: Id, season: Id) => apiPost('exam/result', { season, student }, s),

  notifications: () => apiPost('notification/index', {}, s),
});

export type Api = ReturnType<typeof api>;

// bind helpers to the saved session
export function apiFromSession(): { session: Session; api: Api } {
  const s = loadSession();
  return { session: s, api: api({ env: s.env || 'prod', token: s.token }) };
}
