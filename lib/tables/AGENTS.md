<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# lib/tables

## Purpose
The single-table DynamoDB design holding users and their per-service
credentials, plus a CloudFormation custom resource that seeds example data on
stack creation.

## Key Files
| File | Description |
|------|-------------|
| `tanitaToGarmin.ts` | Users table (PK/SK, PAY_PER_REQUEST, `RemovalPolicy.RETAIN`), `UsernameIndex` GSI (partition key `SK`), seed-data lambda + custom resource |

## For AI Agents

### Working In This Directory
- The table holds real user data and secrets: keep `RemovalPolicy.RETAIN`.
- Item layout: `USER#<uuid>` / `#INFO` | `CRED#TANITA` | `CRED#GARMIN`
  (includes `OAuth1Token`/`OAuth2Token`) | `CRED#GOOGLE`. The GSI enables
  "list all users" via `SK = '#INFO'`.
- The seed lambda (`src/lambdas/ts/seedData/`) only acts on the `Create`
  event; keep that guard or every stack operation would insert junk users
  that produce failing nightly executions.

### Testing Requirements
- Key schema and Retain policy are asserted in `npm test`.

## Dependencies

### Internal
- `src/lambdas/ts/seedData/index.ts` — custom resource handler

### External
- `aws-cdk-lib` (dynamodb, custom-resources)

<!-- MANUAL: -->
