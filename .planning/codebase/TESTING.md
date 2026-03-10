# Testing

**Analysis Date:** 2026-03-10

## Current State

**No runtime test suite exists.** Quality assurance is limited to TypeScript type checking and Prettier formatting.

## Type Checking

**Commands:**
```bash
yarn test:ts:front   # TypeScript check for admin/ code
yarn test:ts:back    # TypeScript check for server/ code
```

**Config:**
- `admin/tsconfig.json` → extends `@strapi/typescript-utils` admin config
- `server/tsconfig.json` → extends `@strapi/typescript-utils` server config
- Build configs exclude tests: `admin/tsconfig.build.json`, `server/tsconfig.build.json`

## Code Formatting

```bash
yarn prettier --check .   # Verify formatting (via Prettier 3.8.1)
```

Config: `.prettierrc` (100-char width, 2-space indent, single quotes, ES5 trailing commas)

## What Is Not Tested

- **Unit tests**: No Jest/Vitest configured — zero component unit tests
- **Integration tests**: No editor behavior tests (extension interactions, toolbar state)
- **E2E tests**: No Cypress/Playwright configured
- **Dialog interactions**: LinkDialog and TableSizeDialog have no behavioral tests
- **Field value handling**: No tests for JSON serialization/deserialization
- **Extension hooks**: No tests for `useLink`, `useTable`, `useHeading`, etc.
- **Error conditions**: No tests for malformed JSON or edge cases

## Test Infrastructure Gap

The codebase has a significant testing gap. The only quality gates are:
1. TypeScript compilation (catches type errors)
2. Prettier (enforces formatting)

There is no test runner, no test files, and no test utilities.

## Recommended Testing Stack (Not Yet Implemented)

For future test coverage:

| Layer | Tool | What to Test |
|-------|------|-------------|
| Unit | Jest + React Testing Library | Components, hooks, utilities |
| Integration | Jest + @tiptap/testing | Extension behavior, editor state |
| E2E | Playwright | Full editor workflows in browser |

## CI/CD

No CI configuration found (no `.github/workflows/`, no CI config files).

---

*Testing analysis: 2026-03-10*
