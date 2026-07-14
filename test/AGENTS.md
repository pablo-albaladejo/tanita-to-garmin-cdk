<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# test

## Purpose
Jest tests that synthesize the CDK stack and assert on the resulting
CloudFormation template. They run without AWS credentials, Docker, or Maven.

## Key Files
| File | Description |
|------|-------------|
| `tanita-to-garmin-cdk.test.ts` | Template assertions: Java lambda, state machine, table key schema + Retain policy, nightly cron rule |

## For AI Agents

### Working In This Directory
- The `beforeAll` writes an empty placeholder jar at
  `src/lambdas/java/fitToolkit/target/fit-toolkit-latest.jar` if missing so
  `lambda.Code.fromAsset` can stage without a Maven build. Don't remove it.
- Synthesis bundles the NodejsFunctions with the local `esbuild` devDep;
  the generous `beforeAll` timeout (120 s) covers cold bundling.

### Testing Requirements
- `npm test`. When the stack gains/loses resources, extend the assertions
  here rather than snapshotting the whole template.

## Dependencies

### Internal
- `lib/tanita-to-garmin-cdk-stack.ts`

### External
- `aws-cdk-lib/assertions`, `jest`, `ts-jest`

<!-- MANUAL: -->
