---
name: update-dependencies
description: Update project dependencies to their latest compatible versions with verification. Use when the user asks to update, upgrade, or bump dependencies.
---

# Update Dependencies

Update all `dependencies` and `devDependencies` in `package.json` to their latest compatible versions using exact pinned versions. Verify each group does not break the build or tests.

## Rules

- Use **exact versions** (no `^` prefix) for `dependencies` and `devDependencies`.
- **NEVER modify `peerDependencies`** — leave them exactly as-is.
- Updated `devDependencies` that also appear in `peerDependencies` must satisfy the existing (unchanged) peer range.
- Do NOT update `react` or `react-dom` beyond 18.x — Strapi v5 requires React 18.
- Prerelease versions (alpha, beta, rc) are only allowed if the **current** version of that package is already a prerelease.
- Do not use non-null assertions (`!.`); prefer null guards if any code changes are needed.

## Procedure

### Step 1 — Snapshot current state

1. Read `package.json` and note every dependency with its current version.
2. Run `yarn outdated` to identify available updates. This command may exit with code 1 when outdated packages exist — that is normal.
3. Create a working list of packages to update, organized into the groups below.

### Step 2 — Update groups in order

Process groups **one at a time** in this order. After each group, run the full verification suite before moving to the next group.

#### Group 1 — @tiptap packages

All packages matching `@tiptap/*`. These must be updated together to the **same version** to avoid peer dependency mismatches between TipTap internals.

Packages: `@tiptap/extension-subscript`, `@tiptap/extension-superscript`, `@tiptap/extension-table`, `@tiptap/extension-text-align`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`

#### Group 2 — @strapi packages

All packages matching `@strapi/*`. These have tight coupling and should be updated together. New versions must remain compatible with the unchanged `peerDependencies` ranges.

Packages (dependencies): `@strapi/design-system`, `@strapi/icons`
Packages (devDependencies): `@strapi/sdk-plugin`, `@strapi/strapi`, `@strapi/typescript-utils`

#### Group 3 — React ecosystem

Update types and related packages. Do NOT bump `react` or `react-dom` beyond 18.x — only update patch/minor within 18.x. Updated versions must satisfy unchanged peer ranges.

Packages: `@types/react`, `@types/react-dom`, `react`, `react-dom`, `react-router-dom`, `styled-components`

#### Group 4 — Standalone packages

Update remaining packages individually.

Packages: `react-intl`, `typescript`, `vitest`, `prettier`

### Step 3 — Per-group sequence

For each group, follow this exact sequence:

1. **Determine latest versions**: Run `yarn info <package> version` for each package to get the latest stable version. For packages currently on prerelease, get the latest prerelease in the same series.
2. **Update package.json**: Set each `dependency`/`devDependency` to the exact new version (no `^`). Do NOT touch `peerDependencies`.
3. **Install**: Run `yarn install` to update `yarn.lock`.
4. **Verify**: Run all verification commands in sequence:
   ```
   yarn build && yarn verify && yarn test && yarn test:ts:front && yarn test:ts:back
   ```
5. **On failure**:
   - Check the error output to determine cause.
   - If the failure is clearly caused by the update and is fixable with a minor code change (e.g., a renamed import, a changed type signature), fix it and re-run verification. Only make minimal, obvious fixes — do not refactor.
   - If not easily fixable, revert `package.json` changes for this group back to the previous versions, run `yarn install`, and note the group as "skipped" with the reason.
6. **On success**: Commit the group update with message: `chore(deps): update <group name> packages`

### Step 4 — Summary

After all groups are processed, output a markdown summary table:

```
## Dependency Update Summary

| Package | Previous | Updated | Group | Status |
|---------|----------|---------|-------|--------|
| @tiptap/react | 3.19.0 | 3.21.2 | @tiptap | ✅ Updated |
| ... | ... | ... | ... | ... |

### Skipped
- `<package>`: <reason for skip>
```

Include the commit hashes for each successful group commit.

## Important Notes

- If `yarn outdated` shows no updates available, report that and stop.
- Always run the full verification suite — do not skip any command.
- When in doubt about compatibility, prefer the conservative choice (skip the update).
- Package manager is **Yarn v1** — use `yarn` commands (not npm/pnpm).
