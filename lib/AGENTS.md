<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# lib

## Purpose
CDK infrastructure code. The stack wires the DynamoDB table, the Step
Functions state machine (TanitaToJson → parallel Garmin/Google branches with
per-service `SyncEnabled` checks), and the nightly trigger.

## Key Files
| File | Description |
|------|-------------|
| `tanita-to-garmin-cdk-stack.ts` | Main stack: chains states, `DynamoGetItem` sync checks, `Parallel` branches, state machine, trigger |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `states/` | One Construct per state machine state (see `states/AGENTS.md`) |
| `tables/` | Users table + seed-data custom resource (see `tables/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- The `DynamoGetItem` sync checks use `projectionExpression` limited to
  `SyncEnabled` ON PURPOSE: the `CRED#*` items hold passwords and OAuth
  tokens which must never appear in Step Functions execution history.
- The `Choice` conditions read `$.xSyncStatus.Item.SyncEnabled.BOOL`; a user
  without the `CRED#*` item is skipped (isPresent guard).
- State payloads are contracts with the lambdas in `src/lambdas/ts/`; change
  both sides together (`$.measurements.data`, `$.file.base64`).

### Testing Requirements
- `npm test` asserts on the synthesized template; update
  `test/tanita-to-garmin-cdk.test.ts` when resources change.

### Common Patterns
- Each state Construct exposes `invocation: tasks.LambdaInvoke` and receives
  `usersTable` via props when it needs data access.

## Dependencies

### Internal
- `src/lambdas/ts/*` — NodejsFunction entries (bundled with esbuild)
- `src/lambdas/java/fitToolkit` — jar asset built by `cdk_hooks.sh`

### External
- `aws-cdk-lib` (stepfunctions, stepfunctions-tasks, lambda-nodejs, dynamodb, events, s3, custom-resources)

<!-- MANUAL: -->
