<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# googleSheetsUpload

## Purpose
Appends one row per measurement to the user's Google Sheet, authenticating
with a service-account key read from S3.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Handler: load key from S3 → JWT auth → `SheetId`/`SheetIndex` from `CRED#GOOGLE` → `addRow` per measurement |

## For AI Agents

### Working In This Directory
- Errors must propagate (the final `catch` rethrows after logging). It used
  to return a 500 "success", hiding failures from Step Functions.
- Dates are reformatted to `MM/DD/YYYY HH:mm:ss` for Sheets; row keys come
  straight from the normalized measurement fields, so the sheet's header row
  must match them.
- The service-account key lives at `credentials/tanita.json` in the bucket
  created by `lib/states/googleSheetsUpload.ts` (uploaded manually); the
  target spreadsheet must be shared with the service-account email.

### Testing Requirements
- `npm run build`; end-to-end via a manual state-machine execution and
  checking the spreadsheet.

## Dependencies

### Internal
- `CRED#GOOGLE` item; input `$.measurements.data` from `tanitaToJson`

### External
- `google-spreadsheet`, `google-auth-library`, `aws-sdk` v2 (S3, DynamoDB)

<!-- MANUAL: -->
