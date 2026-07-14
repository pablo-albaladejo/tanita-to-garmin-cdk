<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# tanita-to-garmin-cdk

## Purpose
Serverless AWS application (CDK, TypeScript) that syncs body-composition
measurements from a Tanita scale (mytanita.eu API) to Garmin Connect and/or
Google Sheets, once a day per user. An EventBridge cron triggers a Step
Functions state machine per user; parallel branches upload to each enabled
service. See `README.md` for the architecture diagram and operational guide.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Scripts (`build`, `test`, `garmin:token`) and pinned dependencies |
| `cdk.json` | CDK app entry; runs `cdk_hooks.sh` before synth |
| `cdk_hooks.sh` | Builds the Java FIT lambda with Maven (fails fast with `set -euo pipefail`) |
| `tsconfig.json` | Strict TS config; `skipLibCheck` needed (garmin-connect ships broken d.ts) |
| `jest.config.js` | ts-jest over `test/` |
| `README.md` | Human-facing docs: architecture, data model, Garmin token seeding |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `bin/` | CDK app entry point (see `bin/AGENTS.md`) |
| `lib/` | CDK constructs: stack, states, table (see `lib/AGENTS.md`) |
| `src/` | Lambda runtime code, TS and Java (see `src/AGENTS.md`) |
| `scripts/` | Operational scripts run locally (see `scripts/AGENTS.md`) |
| `test/` | Jest tests that synthesize the stack (see `test/AGENTS.md`) |
| `.github/` | CI/CD workflow (see `.github/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `npm run build` (tsc) type-checks EVERYTHING including lambda code; it must
  pass before claiming completion. esbuild bundling does NOT type-check.
- User credentials/tokens live in DynamoDB, never in code or env vars. Never
  `console.log` credential values.
- The GarminUpload lambda must never password-login: Garmin returns
  429 "Rate limited" to cloud IPs. OAuth tokens only (see `scripts/AGENTS.md`).
- Deployed from GitHub Actions on push to `main` (account 8967-5163-5911,
  eu-west-1). Do not commit/push without explicit approval.

### Testing Requirements
- `npm test` synthesizes the full stack (needs `esbuild`, not Maven or AWS
  credentials) and asserts on the CloudFormation template.

### Common Patterns
- One CDK Construct per state machine state, exposing `invocation`
  (`tasks.LambdaInvoke`) for chaining in the stack.
- Lambdas use aws-sdk v2 `DocumentClient` and throw on failure so Step
  Functions marks executions FAILED (never swallow errors into 500 responses).

## Dependencies

### External
- `aws-cdk-lib` 2.165 / `constructs` — infrastructure
- `garmin-connect` 1.6.2 — Garmin Connect client (OAuth token reuse)
- `google-spreadsheet` + `google-auth-library` — Sheets upload
- `axios` — mytanita.eu API calls
- Garmin FIT SDK (`fit.jar`, vendored) — .fit file encoding in Java

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
