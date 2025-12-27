# Contributing

## Branching

- Base branch: `main`
- Feature branches: `feature/<short-topic>` or `fix/<short-topic>`
- Keep branches small and short-lived.

## PR rules

- One feature or fix per PR.
- Include a clear summary and testing notes.
- At least one reviewer (PM for scope, BE/FE for code).
- No force-push after review starts unless requested.

## Definition of Done (DoD)

- Feature works locally.
- Docs updated if behavior or setup changes.
- No new warnings in logs.
- PR has test or manual verification notes.

## Tests / checks

From repo root:
```bash
npm run lint -w apps/web
```

API has no automated tests yet. If you add any, document how to run them here.
