<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# fitToolkit

## Purpose
Java 11 Maven project that converts the normalized measurements JSON into a
binary Garmin `.fit` weight file, returned as base64. Deployed as the
`JsonToFit` lambda.

## Key Files
| File | Description |
|------|-------------|
| `pom.xml` | Maven build (Java 11); depends on the local `fit.jar` artifact |
| `libs/fit.jar` | Vendored Garmin FIT SDK; installed as local Maven artifact by `cdk_hooks.sh` |
| `src/main/java/fit/toolkit/handler/WeightHandler.java` | Lambda entry point: JSON array → `WeightScaleMesg` records → base64 `.fit` |
| `src/main/java/fit/toolkit/handler/WeightScaleMesgBMI.java` | `WeightScaleMesg` subclass adding a BMI field (field 13) the stock SDK doesn't expose |
| `src/main/java/fit/toolkit/handler/FieldBMI.java` | Thin `Field` subclass used to register the BMI field |

## For AI Agents

### Working In This Directory
- The build output must land at `target/fit-toolkit-latest.jar` — the CDK
  asset path in `lib/states/jsonToFit.ts` depends on it.
- `WeightHandler` expects every JSON entry to include: date (ISO), weight,
  body_fat, body_water, muscle_mass, bmr, physique_rating, visc_fat,
  bone_mass, metab_age, bmi. Missing keys throw at runtime; if
  `tanitaToJson`'s output shape changes, update both sides.
- Handler signature uses APIGatewayProxy events; the body arrives via
  Step Functions payload `{ body: <json-string> }`.

### Testing Requirements
- No Java tests; jest synthesizes against a placeholder jar. Build locally
  with `sh cdk_hooks.sh` (requires Maven).

## Dependencies

### Internal
- Input produced by `src/lambdas/ts/tanitaToJson/`; output consumed by
  `src/lambdas/ts/garminUpload/`

### External
- Garmin FIT SDK (`fit.jar`), Gson, AWS Lambda Java core/events

<!-- MANUAL: -->
