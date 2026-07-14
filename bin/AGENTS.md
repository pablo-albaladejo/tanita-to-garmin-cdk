<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# bin

## Purpose
CDK application entry point. Instantiates `TanitaToGarminCdkStack` from
`lib/` with no explicit `env`, so the synthesized template is
account/region-agnostic (the deploy target comes from the active AWS
credentials — GitHub Actions in practice).

## Key Files
| File | Description |
|------|-------------|
| `tanita-to-garmin-cdk.ts` | Creates the CDK `App` and the single stack |

## For AI Agents

### Working In This Directory
- Keep the stack env-agnostic unless the user explicitly wants to pin
  account/region; pinning would break the current CI deploy flow.

### Testing Requirements
- Covered indirectly by `npm test`, which instantiates the stack directly.

## Dependencies

### Internal
- `lib/tanita-to-garmin-cdk-stack.ts` — the only stack

<!-- MANUAL: -->
