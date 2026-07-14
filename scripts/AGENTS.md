<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# scripts

## Purpose
Operational scripts run locally by a human, not deployed to AWS.

## Key Files
| File | Description |
|------|-------------|
| `garminTokenLogin.ts` | One-time Garmin password login that seeds `OAuth1Token`/`OAuth2Token` into the user's `CRED#GARMIN` DynamoDB item |

## For AI Agents

### Working In This Directory
- `garminTokenLogin.ts` MUST be run from a residential IP: Garmin returns
  429 "Rate limited" to password logins from cloud/VPN/datacenter IPs. This
  is the whole reason tokens exist — never move this login into a lambda.
- AWS credentials are resolved by shelling out to
  `aws configure export-credentials` because aws-sdk v2 cannot read the
  newer profile types (SSO, `aws login` sessions). Keep that indirection.
- Usage: `AWS_PROFILE=<p> USERS_TABLE=<table> npm run garmin:token -- <userId>`.
  The OAuth1 token lasts ~1 year; re-run on expiry.

### Testing Requirements
- Type-checked by `npm run build`. No automated tests; verify manually
  (the script prints a confirmation and the lambda consumes the tokens).

## Dependencies

### Internal
- Writes to the users table defined in `lib/tables/`; consumed by
  `src/lambdas/ts/garminUpload/`

### External
- `garmin-connect` (login + `exportToken()`), `aws-sdk` v2, AWS CLI v2

<!-- MANUAL: -->
