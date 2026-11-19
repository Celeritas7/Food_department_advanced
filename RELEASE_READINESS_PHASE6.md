# Phase 6 — Release readiness

> Update, November 20, 2026 (Japan): the pending migrations below have now been applied and the live catalog audit passes 23/23. The NO-GO findings below are the historical pre-activation snapshot. See `DATABASE_ACTIVATION_PHASE7.md` for the backup, rehearsal, migration versions and rolled-back hosted acceptance results. Physical-device acceptance remains pending.

This extends the original five feature phases with release verification. Phase 5 is merged through PR #19 (`ec79f9f`). This change adds verification tooling, not another food feature or a production deployment.

## Current decision: NO-GO for new-feature acceptance

Read-only catalog audit of **General_apps**, November 20, 2026 (Japan time): **10 of 23 structural checks passed; 13 failed**. No application rows were read or modified.

| Area | Observed result |
| --- | --- |
| Existing core ownership | Six existing food tables pass the owner-column/RLS/anonymous-access checks |
| Phase 1 pantry | `stock_status`, `unit_conversions`, preparation `recipe_unit`, and stock-conversion function missing |
| Phase 2 scaling | Existing cook function present; `batchScale` body marker absent |
| Phase 3 aliases/substitutions | `aliases` column and substitution function missing |
| Phase 4 equipment | No new SQL required; existing recipe JSON stores supplies |
| Phase 5 fermentation | Tables, start/append functions, snapshot trigger and append-only entry checks fail because the new schema is absent |

Merging source/build files does not run the SQL migrations. The new frontend features cannot be accepted as working against this database yet. Existing database ownership passing these checks is not a complete security assessment.

## Repeatable local check

```bash
npm ci --legacy-peer-deps
npm run verify
```

`verify` stops on the first failure and runs:

- All 153 Jest tests.
- Scaling, ingredient identity, supplies and fermentation component interaction scripts.
- Pantry and fermentation SQL regressions in isolated PGlite databases.
- Release-audit regressions against missing schema, the complete migrated schema, and deliberately disabled RLS.
- Pages checker regressions, production build and emitted-asset checks.

No hosted SQL, production credentials, deployments or git writes occur in this command. The build rewrites local `docs/`. Production builds require the configured `VITE_SUPABASE_URL` and public `VITE_SUPABASE_ANON_KEY`; never use a service-role key. CI uses the unconfigured fallback and its generated build is for verification only, not deployment.

The existing Vite 8 / React plugin 4 peer mismatch requires `--legacy-peer-deps`. Existing deprecation/Browserslist warnings remain; this phase does not upgrade dependencies.

`.github/workflows/verify.yml` runs this command on pull requests, pushes to main and manual workflow dispatch, with a read-only repository token and no production secrets. It does not deploy, apply SQL, or configure branch protection. A maintainer must make the check required separately if desired. First hosted workflow execution remains to be observed after publication.

## Pages output

Vite now emits a manifest. `check:pages` verifies the HTML asset URLs use `/Food_department_advanced/`, the referenced files exist, and the manifest's files, CSS, assets and static/dynamic chunk dependencies are present.

The source icon paths now explicitly use `%BASE_URL%`. Vite already rebased the original public icon URLs in production; this preserves the existing correct output and guards future changes. This is not a claim that the previous production icons were broken.

These are emitted-output checks, not a browser rendering test or a source/build freshness comparison. The build itself compiles the current sources; CI does not commit its output. Real-browser/mobile acceptance remains pending.

## Read-only hosted audit

Run `scripts/release-audit.sql` through a trusted database operator connection or SQL editor. It executes only SELECT/catalog queries, does not invoke application RPCs, and returns check names and booleans without application data.

Checks cover expected column types, required function signatures, invoker/search-path/role grants, owner-column and RLS policy presence, anonymous table access, the scaling body marker, and fermentation trigger/append-only permissions. Missing objects produce failed checks rather than query errors. The audit is not a migration-history verifier, exact function-body comparison, policy-expression proof, or signed-in behavior test. A green result is necessary structural evidence, not production acceptance.

## Release sequence still required

1. Take and verify a current **General_apps** database backup. The earlier Technical project backup is a different database.
2. Review live schema and apply pending migrations after existing owner migrations 016/017, in this order:
   - `20261119123058_accurate_pantry_calculations.sql`
   - `20261119125254_recipe_batch_scaling.sql`
   - `20261119131750_ingredient_aliases_substitutions.sql`
   - `20261119150000_fermentation_batches.sql`
3. Re-run the hosted catalog audit. Investigate any failed check before continuing. These migration files are not generally idempotent; do not blindly rerun one after an error.
4. Run signed-in acceptance with isolated test records: scale, substitute, cook/revert with exact stock restoration, equipment notes, two fermentation batches, retained snapshots, next checks, close/discard, and version 3 export. Verify a second account cannot access the first account's records.
5. Build with the intended public configuration, review and publish the matching `docs/` output through the repository's existing main/docs Pages setup. Do not use the legacy `npm run deploy` shortcut: it targets `dist` and the gh-pages branch, not this Pages setup.
6. Check desktop and Android/iPad layouts and persistence after reopening. Record deployment/commit and acceptance outcomes.

No production migration, backup, merge, deployment, branch-protection change, or signed-in production mutation was performed in this phase. Existing pending migration and physical-device requirements remain outstanding.
