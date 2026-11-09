# eParent API — Reference

Backend of the **eParent** Android app (`dem.eschool.eparent`), reconstructed from the app's React Native / Hermes bundle. For authorized testing and interoperability.

---

## 1. Environments

| Environment | Base URL |
|-------------|----------|
| Production  | `https://eparent.eschool.mn/` |
| Test/Staging| `https://eparent-test.eschool.mn/` |

Related hosts seen in the app (not covered here): `api.eschool.mn` (some locale/module calls), `lms.eschool.mn` (LMS web), `chat.hota.mn` (E2E-encrypted chat SDK), `d2njplyfttctnv.cloudfront.net` (OTA JS bundle updates).

All API calls are **`POST`**. Paths below are relative to the base URL.

---

## 2. Transport & encryption

Every request body and every response body is **AES-encrypted** (CryptoJS-compatible). Plaintext is always JSON.

### Parameters (fixed, hardcoded in the app)
| Item | Value |
|------|-------|
| Cipher | AES-256-**CBC**, PKCS7 padding |
| Key derivation | PBKDF2 |
| &nbsp;&nbsp;password | `ESCHOOL_EPARENT` (UTF-8) |
| &nbsp;&nbsp;salt | hex `3536373334653339353535373731373635363466` (20 bytes) |
| &nbsp;&nbsp;iterations | `999` |
| &nbsp;&nbsp;hash | **SHA-512** |
| &nbsp;&nbsp;key size | 256 bits (8 words) |
| IV | hex `36333532333137383339353937383431` (16 bytes = ASCII `6352317839597841`) |

Because the salt, IV, password and iteration count are all constant, the **derived key is constant**:

```
AES-256 key (hex): 032f01123502c2b1b30bd969e3825d46a535e87d9717b963004f736f46862b3b
IV         (hex): 36333532333137383339353937383431
```

The value sent/received is the **Base64 of the raw ciphertext** (no OpenSSL `Salted__` prefix).

### Request wire format
- **Method:** `POST`
- **Headers:**
  | Header | Value |
  |--------|-------|
  | `Content-Type` | `application/x-www-form-urlencoded; charset=utf-8` |
  | `Accept` | `application/json` |
  | `NAppType` | `eParent` |
  | `OS` | `ANDROID` or `IOS` |
  | `origin` | `https://eparent.eschool.mn` |
  | `Authorization` | `Bearer <accessToken>` — **authenticated calls only** |
- **Body:** form-urlencoded, a single field:
  ```
  data=<URL-encoded Base64 ciphertext of the JSON payload>
  ```

### Response wire format
JSON object `{ "data": "<Base64 ciphertext>" }`. Decrypt `data` with the same key/IV to get the JSON result. Decrypted results follow:
```json
{ "success": true,  ... }
{ "success": false, "message": "<error text, often Mongolian>" }
```

### Reference implementations

**Node (crypto-js):**
```js
import CryptoJS from 'crypto-js';
const KEY = CryptoJS.PBKDF2('ESCHOOL_EPARENT',
  CryptoJS.enc.Hex.parse('3536373334653339353535373731373635363466'),
  { keySize: 8, iterations: 999, hasher: CryptoJS.algo.SHA512 });
const IV = CryptoJS.enc.Hex.parse('36333532333137383339353937383431');
const enc = p => CryptoJS.AES.encrypt(p, KEY, { iv: IV }).ciphertext.toString(CryptoJS.enc.Base64);
const dec = c => CryptoJS.AES.decrypt(c, KEY, { iv: IV }).toString(CryptoJS.enc.Utf8);
```

**OpenSSL CLI** (key/iv are hex above):
```bash
# encrypt a payload.json -> base64 ciphertext
openssl enc -aes-256-cbc -K 032f01123502c2b1b30bd969e3825d46a535e87d9717b963004f736f46862b3b \
  -iv 36333532333137383339353937383431 -in payload.json -a -A
```

**curl** (login example, body already encrypted into $DATA):
```bash
curl -s https://eparent.eschool.mn/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=utf-8' \
  -H 'Accept: application/json' -H 'NAppType: eParent' -H 'OS: ANDROID' \
  --data-urlencode "data=$DATA"
```

---

## 3. Authentication

Two-token scheme: a short-lived **access token** (sent as `Authorization: Bearer`) and a longer-lived **refresh token**.

### Login — `POST auth/login`
Request:
```json
{ "username": "...", "password": "...", "device": "Pixel 8", "uniqueId": "<16-hex ANDROID_ID>" }
```
Response (on success) includes `token` (access) and `refreshToken`. `device`/`uniqueId` are recorded for device tracking; any stable values work.

### Refresh — `POST auth/refresh`
Request:
```json
{ "token": "<current access token>", "refreshToken": "<refresh token>" }
```
Returns a new `token`. The `refreshToken` **rotates only if** the response contains a new one; otherwise the old one stays valid. If no `token` is returned, the session is dead → log in again.

The app refreshes **reactively** (on an unauthorized response), then retries the original request. No client-side expiry check; token lifetime is server-defined (decode the token if it is a JWT to read `exp`).

### Registration & recovery
| Endpoint | Request fields |
|----------|----------------|
| `auth/register-check` | `username` |
| `auth/register-check-code` | `username`, `code` |
| `auth/register-resend` | `username` |
| `auth/register` | `username`, `code`, `password` |
| `auth/recover` | `username` |
| `auth/recover-check-code` | `username`, `code` |
| `auth/recover-submit` | `username`, `code`, `password` |

### Alternative SSO (hamuga / national ID)
| Endpoint | Request fields | Notes |
|----------|----------------|-------|
| `auth/hamuga/login-url` | `state` | Returns `{ success, url, returnUrl }`; open `url` in a browser |
| `auth/hamuga-exchange` | `exchange_code`, `uniqueId`, `device` | Exchanges the SSO code for a session |

---

## 4. Endpoints

> All `POST`, all require `Authorization: Bearer` unless noted. `student` = a student (child) id. `season` = academic season/term id. Fields marked *(opt)* are optional. Dates are `YYYY-MM-DD`.

### App / profile
| Endpoint | Request | Notes |
|----------|---------|-------|
| `main/init` | `{ device }` | Parent profile + `students[]` (children). First call after login. |
| `main/home` | `{ student, date, device }` | Dashboard for one child. |
| `main/tips` | `{ student, lang }` | Tips/announcements. |
| `student/info` | `{ id }` | Student detail. |
| `student/add` | `{ qr, student, type, value, label }` | Link a child (via QR/scan). |
| `student/scan` | `{ qr }` | Resolve a scanned QR. |
| `student/remove` | `{ student }` | Unlink a child. |
| `student/level-hood-approval` | `{ student }` | Grade-level approval. |

### Attendance
| Endpoint | Request | Notes |
|----------|---------|-------|
| `attendance/index` | `{ student, season, type, date }` | `type` is a tab filter (e.g. `DAY`), uppercased. |
| `attendance/detail` | `{ student, date, type }` | |
| `attendance/approve` | `{ student, date, approve }` | Parent approves/justifies. |
| `attendance/requests` | `{ student, season, day, date, page, pageSize }` | Excuse requests list. |
| `attendance/request-detail` | `{ student, request, day, time, action }` | |
| `attendance/request-init` | `{ student, name, size, mime, extension, path }` | Start an excuse request (file meta). |
| `attendance/request-submit-file` | `{ uri, name, type, extension, fileSize }` | Upload attachment. |

### Academics
| Endpoint | Request | Notes |
|----------|---------|-------|
| `homework/index` | `{ student, season, type }` | |
| `homework/detail` | `{ student, season, date, type }` | |
| `homework/file` | `{ student, type }` | |
| `exam/index` | `{ student, season, isDigital }` | |
| `exam/list` | `{ student, season, group }` | |
| `exam/detail` | `{ student, examDtl, key }` | |
| `exam/result` | `{ student, season, key }` | |
| `exam/result-list` | `{ student, season, scoreType, key }` | |
| `timetable/weekly` | `{ student, index }` | `index` = week offset (0 = current). |

### News feed (school-scoped)
| Endpoint | Request | Notes |
|----------|---------|-------|
| `newsfeed/index` | `{ school, newsfeed, action }` | |
| `newsfeed/list` | `{ school, page, roleCode }` | |
| `newsfeed/create` | `{ school, content, role, files }` | |
| `newsfeed/comment-create` | `{ school, newsfeed, comment, parent }` | `parent` for replies *(opt)*. |

### Payments (QPay)
| Endpoint | Request | Notes |
|----------|---------|-------|
| `payment/index` | `{ student, type, page, pageSize }` | |
| `payment/invoice` | `{ invoice }` | |
| `payment/pay` | `{ }` (context-dependent) | QPay flow. |

### Books (rent / sale)
| Endpoint | Request | Notes |
|----------|---------|-------|
| `book-rent/init` | `{ student }` | |
| `book-rent/detail` | `{ student, request }` | |
| `book-rent/pay` | `{ student, request }` | |
| `book-rent/submit` | `{ student, package }` | |
| `book-sale/index` | `{ sellers, sellerCount }` | |

### Notifications
| Endpoint | Request | Notes |
|----------|---------|-------|
| `notification/index` | `{ page }` | |
| `notification/seen` | `{ id, type, student, school, season, date, screen, params, isDigital }` | Mark read + deep-link context. |
| `notification/turn_off` | `{ typeCode }` | Mute a notification type. |

### User / account
| Endpoint | Request | Notes |
|----------|---------|-------|
| `user/profile-update` | `{ ...profile fields }` | |
| `user/avatar-update` | `{ avatar }` | Base64/URL. |
| `user/change-password` | `{ current, new, newRepeat }` | |
| `user/deactivate` | `{ }` | Deactivate account. |

### Feedback
| Endpoint | Request | Notes |
|----------|---------|-------|
| `feedback/main/index` | `{ student, page }` | |
| `feedback/main/submit` | `{ uri, name, type, extension, fileSize }` | With attachment. |

### System
| Endpoint | Request | Notes |
|----------|---------|-------|
| `system/file-upload` | `{ content, type, includeBase64 }` | Generic upload. |

---

## 5. Notes & caveats
- Field lists come from the decompiled client; some endpoints accept more optional fields than shown. Confirm against live responses.
- `success: false` responses still return HTTP 200 with a `message`; always check `success`.
- The `data`-wrapped encryption applies to **all** endpoints here, including errors.
- `device`/`uniqueId` are free-form identifiers; keep them stable per "device".
- Respect the service's terms; use only with accounts you're authorized to access.
