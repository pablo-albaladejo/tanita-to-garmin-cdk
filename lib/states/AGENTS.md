<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# lib/states

## Purpose
One CDK Construct per Step Functions state. Each creates its lambda (and any
supporting resources) and exposes `invocation: tasks.LambdaInvoke` for the
stack to chain.

## Key Files
| File | Description |
|------|-------------|
| `trigger.ts` | Nightly EventBridge cron (00:00 UTC) → trigger lambda; grants `StartExecution` on the state machine |
| `tanitaToJson.ts` | Fetch/normalize lambda; result stored at `$.measurements` (payload: userId, start_date, end_date) |
| `jsonToFit.ts` | Java 11 lambda from the Maven-built jar asset; JSON → base64 `.fit` at `$.file` |
| `garminUpload.ts` | Upload lambda; `grantReadWriteData` so it can persist refreshed OAuth tokens |
| `googleSheetsUpload.ts` | Upload lambda + S3 credentials bucket (`RemovalPolicy.RETAIN`); reads `credentials/tanita.json` |

## For AI Agents

### Working In This Directory
- `jsonToFit.ts` points at `src/lambdas/java/fitToolkit/target/fit-toolkit-latest.jar`;
  the file only exists after `cdk_hooks.sh` (Maven) or the test placeholder.
- `garminUpload.ts` needs read AND write on the users table (token
  persistence). Don't downgrade to `grantReadData`.
- The Google credentials bucket must stay private (`BLOCK_ALL`) and retained;
  it holds a service-account private key uploaded out-of-band.

### Testing Requirements
- `npm test` synthesizes all constructs; assert new resources in
  `test/tanita-to-garmin-cdk.test.ts`.

### Common Patterns
- `NodejsFunction` with `entry` into `src/lambdas/ts/<name>/index.ts`,
  `runtime: NODEJS_20_X`, 300 s timeout, `USERS_TABLE` env var.
- `LambdaInvoke` payloads pull from the execution state with
  `sfn.JsonPath.stringAt(...)`; `resultSelector`/`resultPath` shape the state.

## Dependencies

### Internal
- Handlers in `src/lambdas/ts/` and `src/lambdas/java/fitToolkit/`

<!-- MANUAL: -->
