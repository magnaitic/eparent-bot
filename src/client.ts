// Thin API client matching the eParent app's wire format.
//   POST <base><path>
//   headers: NAppType/OS/origin, form-urlencoded content-type (+ Bearer when authed)
//   body:    JSON string  {"data": "<encrypted JSON payload>"}
//   reply:   {"data": "<encrypted JSON>"}  -> auto-decrypted here
import { encryptJson, decrypt } from './crypto.ts';

export type Env = 'prod' | 'test';

const BASES: Record<Env, string> = {
  prod: 'https://eparent.eschool.mn/',
  test: 'https://eparent-test.eschool.mn/',
};

export interface RequestOptions {
  env?: Env;
  token?: string | null;
}

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  raw: string;
  data: T;
}

export async function apiPost<T = any>(
  path: string,
  payload: unknown = {},
  { env = 'prod', token = null }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const base = BASES[env] ?? BASES.prod;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    'NAppType': 'eParent',
    'OS': 'ANDROID',
    'origin': 'https://eparent.eschool.mn',
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  // form-urlencoded: data=<base64 cipher>  (matches the app / the working PowerShell call)
  const body = new URLSearchParams({ data: encryptJson(payload) }).toString();
  const res = await fetch(base + path, { method: 'POST', headers, body });
  const raw = await res.text();

  let parsed: any = null;
  try { parsed = JSON.parse(raw); } catch { /* non-JSON */ }

  let data: any = parsed;
  if (parsed && typeof parsed.data === 'string') {
    try { data = JSON.parse(decrypt(parsed.data)); }
    catch (e) { data = { _decryptError: String(e), encrypted: parsed.data }; }
  }
  return { status: res.status, ok: res.ok, raw, data };
}
