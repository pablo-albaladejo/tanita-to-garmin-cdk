<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# tanitaToJson

## Purpose
Fetches the user's measurements from the mytanita.eu API for a date range and
normalizes them into the flat JSON shape the rest of the pipeline consumes.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Handler: read `CRED#TANITA` from DynamoDB, compute UTC day-range timestamps, delegate to `tanita.ts` |
| `tanita.ts` | mytanita.eu API client: login → resolve profile id → fetch measurements → map `measurementEntries` to flat fields |

## For AI Agents

### Working In This Directory
- Do NOT log credentials (a password used to leak to CloudWatch from here).
- `API_KEY` in `tanita.ts` is the Tanita app's public client key, not a user
  secret — intentional.
- The `Profile` attribute is the Tanita `userProfileId`; `tanita.ts` maps it
  to the internal account id before filtering measurements.
- The output field names (weight, bmi, body_fat, visc_fat, muscle_mass,
  bone_mass, bmr, metab_age, body_water, physique_rating…) are consumed by
  BOTH the Java FIT encoder and the Sheets uploader — change all three
  together.

### Testing Requirements
- `npm run build`; behavior is verified with a manual state-machine
  execution against real credentials.

## Dependencies

### Internal
- `CRED#TANITA` item from the users table

### External
- `axios`, `aws-sdk` v2

<!-- MANUAL: -->
