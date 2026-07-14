<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# trigger

## Purpose
Entry point of the nightly sync. Lists every user (GSI `UsernameIndex`,
`SK = '#INFO'`) and starts one state-machine execution per user with
`{ userId, start_date: yesterday, end_date: today }`.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Handler: query users → `startExecution` per user |

## For AI Agents

### Working In This Directory
- Fired by the EventBridge cron in `lib/states/trigger.ts` (00:00 UTC); the
  incoming event payload is ignored.
- The execution input shape is the contract consumed by `tanitaToJson`.

### Testing Requirements
- `npm run build`; verify end-to-end by invoking the lambda manually and
  checking Step Functions executions.

## Dependencies

### Internal
- Table/GSI from `lib/tables/`; state machine ARN via `STATE_MACHINE_ARN`

### External
- `aws-sdk` v2 (DynamoDB DocumentClient, StepFunctions)

<!-- MANUAL: -->
