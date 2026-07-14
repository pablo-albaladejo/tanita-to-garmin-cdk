<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# garminUpload

## Purpose
Uploads the base64 `.fit` file to Garmin Connect authenticating with OAuth
tokens stored in DynamoDB, then persists the (possibly refreshed) tokens back.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Handler: load `OAuth1Token`/`OAuth2Token` from `CRED#GARMIN` → `loadToken()` → `uploadActivity()` → `exportToken()` and write back |

## For AI Agents

### Working In This Directory
- NEVER add a password `login()` here. Garmin rate-limits password logins
  from cloud IPs with 429 "Rate limited" — that broke the nightly sync for
  months (2026-03-18 onward) before the token flow was introduced.
- Tokens are seeded by `scripts/garminTokenLogin.ts` from a residential IP.
  If they're missing the handler throws with instructions; keep that message
  actionable.
- The `garmin-connect` client auto-refreshes the OAuth2 token (using OAuth1)
  when `expires_at` passes; persisting after every upload is what keeps the
  stored copy valid. OAuth1 lasts ~1 year.
- Tokens are stored as JSON strings; `GarminConnect` is constructed with
  empty credentials on purpose.

### Testing Requirements
- `npm run build`; end-to-end via a manual state-machine execution (needs
  seeded tokens and a real measurement in the date range).

## Dependencies

### Internal
- `CRED#GARMIN` item (read/write — see `lib/states/garminUpload.ts` grant);
  input `$.file.base64` from the Java FIT lambda

### External
- `garmin-connect` 1.6.2, `aws-sdk` v2

<!-- MANUAL: -->
