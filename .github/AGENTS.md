<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-15 | Updated: 2026-07-15 -->

# .github

## Purpose
CI/CD configuration (GitHub Actions).

## Key Files
| File | Description |
|------|-------------|
| `workflows/cdk-deploy.yml` | `test` job (build + jest) on PRs and pushes; `deploy` job (`cdk deploy`) only on push to `main`, after `test` |

## For AI Agents

### Working In This Directory
- The deploy job needs Java 25 (Temurin) because `cdk_hooks.sh` runs Maven
  during synth; the test job doesn't (tests use a placeholder jar).
- AWS auth comes from repo secrets `AWS_ACCESS_KEY_ID` /
  `AWS_SECRET_ACCESS_KEY` and repo variable `AWS_REGION` (eu-west-1).
  Secrets are not readable via API — don't try.
- A push to `main` deploys straight to production; keep the
  `if: github.event_name == 'push'` guard on the deploy job.

### Testing Requirements
- Validate workflow changes with a PR (runs the `test` job) before merging.

## Dependencies

### External
- `actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-java@v4`,
  `aws-actions/configure-aws-credentials@v4`

<!-- MANUAL: -->
