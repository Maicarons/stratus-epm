# Contributing to Stratus EPM

Thanks for your interest in contributing!

## Workflow

1. Fork and create a feature branch
2. Install deps: `pnpm install`
3. Run tests: `pnpm test`
4. Update docs under `docs/guide/` when behavior changes
5. Open a PR with clear motivation and test evidence

## Code style

- TypeScript strict
- Domain engines in `packages/core` must stay pure (no IO)
- Prefer small, reviewable commits

## License

By contributing, you agree that your contributions are licensed under the Apache License 2.0.
