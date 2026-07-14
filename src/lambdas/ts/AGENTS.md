<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# src/lambdas/ts

## Purpose
TypeScript lambda handlers. Each subdirectory is one lambda, bundled by
`NodejsFunction` (esbuild) from its `index.ts` entry.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `trigger/` | Starts one state-machine execution per user (see `trigger/AGENTS.md`) |
| `tanitaToJson/` | Fetches and normalizes Tanita measurements (see `tanitaToJson/AGENTS.md`) |
| `garminUpload/` | Uploads the `.fit` file to Garmin via OAuth tokens (see `garminUpload/AGENTS.md`) |
| `googleSheetsUpload/` | Appends measurements to Google Sheets (see `googleSheetsUpload/AGENTS.md`) |
| `seedData/` | CloudFormation custom-resource seeder (see `seedData/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- esbuild does NOT type-check; always run `npm run build` after edits.
- Throw on failure — never catch-and-return a 500. Step Functions treats any
  lambda response as success, so swallowed errors become invisible (this
  exact bug hid failed uploads in the past).
- Never log credential or token values.
- Handlers use aws-sdk v2 (`AWS.DynamoDB.DocumentClient`); keep that until a
  deliberate v3 migration — mixing SDKs bloats bundles.

### Testing Requirements
- No unit tests today; `npm run build` is the minimum bar. Verify behavior
  via a manual state-machine execution (see root `README.md`).

### Common Patterns
- Config via env vars set in `lib/states/` (`USERS_TABLE`, etc.), validated
  at handler start.
- DynamoDB keys: `{ PK: 'USER#<userId>', SK: 'CRED#<SERVICE>' }`.

## Dependencies

### Internal
- Payload shapes are defined by `LambdaInvoke` in `lib/states/`.

### External
- `aws-sdk` v2, `axios`, `garmin-connect`, `google-spreadsheet`,
  `google-auth-library`, `uuid`

<!-- MANUAL: -->
