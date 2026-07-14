<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# seedData

## Purpose
CloudFormation custom-resource handler that inserts an example user (all four
item types) into the users table when the stack is first created, documenting
the expected item shapes.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Handler: guard on `RequestType === 'Create'`, then `batchWrite` the example items |

## For AI Agents

### Working In This Directory
- Keep the `Create`-only guard: the handler is also invoked for Update/Delete
  custom-resource events, and each run would insert a NEW random-uuid user
  whose fake credentials produce failing nightly executions.
- The example items double as the data-model reference (`#INFO`,
  `CRED#TANITA`, `CRED#GARMIN`, `CRED#GOOGLE` with `SyncEnabled` flags).

### Testing Requirements
- `npm run build`. Synthesized as part of `npm test` (custom resource +
  provider in `lib/tables/`).

## Dependencies

### Internal
- Users table from `lib/tables/tanitaToGarmin.ts`

### External
- `aws-sdk` v2, `uuid`

<!-- MANUAL: -->
