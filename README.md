# eparent-pack

Reverse-engineered client for the **eParent** (`dem.eschool.eparent`) API, recovered from the app's React Native / Hermes bundle.

## How it works
- Base URL: `https://eparent.eschool.mn/` (prod) or `https://eparent-test.eschool.mn/` (test)
- Request/response bodies are **AES-256-CBC** encrypted (CryptoJS), key = `PBKDF2("ESCHOOL_EPARENT", salt, 999 iters, SHA-512)` with a fixed IV. See `src/crypto.mjs`.
- Wire format: `POST` with body `{"data":"<encrypted JSON>"}`; the reply's `data` field is decrypted automatically.
- After login, authenticated calls send `Authorization: Bearer <token>`.

## Setup
```bash
npm install
npm run selftest      # offline: verifies the crypto round-trips
```

## Log in
```bash
npm run login                         # prompts for username/password
# or
EPARENT_USER=you EPARENT_PASS=secret npm run login
# test env:
EPARENT_ENV=test npm run login
```
On success the session token is saved to `token.json` (git-ignored).

## Call endpoints
```bash
npm run call -- main/home
npm run call -- student/info
npm run call -- attendance/index '{"month":"2026-11"}'
```

## Known endpoints
`auth/login`, `auth/refresh`, `main/home`, `main/init`, `student/info`, `student/add`,
`attendance/index`, `attendance/detail`, `homework/index`, `exam/index`, `exam/result`,
`timetable/weekly`, `newsfeed/index`, `payment/index`, `notification/index`,
`user/profile-update`, `user/change-password`  (full map in the analysis notes).

> For authorized testing/research only.
