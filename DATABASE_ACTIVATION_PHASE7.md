# Phase 7 — Database activation and hosted verification

Completed November 20, 2026 (Japan time), on top of merged Phase 6 PR #20 (`563e1ac`). The pending database migrations are now applied to **General_apps**. This phase changes the live Food Department schema; it does not add another frontend feature.

## Backup and rehearsal

Before any hosted change, created a private Food Department snapshot containing all **1,137 rows across 11 tables**, column definitions/defaults, constraints, indexes, triggers, functions/ACLs, policies, grants and the existing view. The snapshot was captured in one SELECT statement for a consistent application-data snapshot. It excludes other apps, auth credentials and Storage; this is not a whole-project pg_dump or Supabase managed backup.

The private ZIP includes the JSON snapshot, local rehearsal script, migration files, lockfile and instructions. It was saved separately from this public repository and contains private recipe/ownership data. Do not commit it here.

- Snapshot JSON: 830,913 bytes; SHA-256 `58e847a3bc42b5e94c0d7ead8e41edbe0050f0ba075b53ba47f936b4f06a05dc`.
- Backup ZIP: 242,722 bytes; SHA-256 `cf5694862558aa58166d41415c6c77d0925e301932be30d73faf8d42f9b1faa2`.

`scripts/rehearse-database-release.mjs <snapshot.json>` reconstructs the captured schema and rows in an isolated PGlite database, checks every restored row using PostgreSQL JSON equality, applies the four migrations, and verifies preservation. It uses owner UUID stubs solely to validate foreign keys; it does not restore real authentication or connect to a hosted database. The script is a migration rehearsal, not an automated production recovery utility.

All 1,137 rows restored successfully. Migrating this real-data copy passed 23/23 structural audit checks. Every existing value was retained except **14 legacy `in_stock` flags**, intentionally reconciled with recorded stock quantities by Phase 1. No stock quantities were changed. New aliases/conversion arrays start empty; existing quantities and units were not guessed.

A local PostgreSQL fingerprint of each restored table matched the live pre-migration table, confirming the snapshot still matched the application data immediately before applying migrations.

## Applied migrations

The committed SQL was applied in order through the database migration service. The service assigned these hosted history versions (distinct from source-file timestamps):

| Source file | Hosted version | Migration name |
| --- | --- | --- |
| `20261119123058_accurate_pantry_calculations.sql` | `20261119155118` | `food_department_accurate_pantry_calculations` |
| `20261119125254_recipe_batch_scaling.sql` | `20261119155127` | `food_department_recipe_batch_scaling` |
| `20261119131750_ingredient_aliases_substitutions.sql` | `20261119155130` | `food_department_ingredient_aliases_substitutions` |
| `20261119150000_fermentation_batches.sql` | `20261119155132` | `food_department_fermentation_batches` |

No changes to unrelated applications were requested or made. Do not rerun these non-idempotent migrations. Future tooling must reconcile source filenames with these recorded hosted names/versions rather than treating the local timestamps as proof that a migration is pending.

## Hosted verification

- Read-only `scripts/release-audit.sql`: **23/23 passed**, up from 10/23 before activation. This remains a structural check, not an exhaustive policy/body proof.
- Original-table counts and PostgreSQL JSON fingerprints remained identical before/after, excluding only the intentionally reconciled presence flag and newly introduced fields.
- Existing row counts remain: 89 dishes, 209 ingredients, 793 dish ingredient links, 8 preparations, 18 preparation ingredient links, 7 dish/preparation links, 7 cook-history records, 5 usage-log records, 1 general-shopping record, 0 shops, 0 ingredient/shop links.
- No inconsistent presence flags remain.
- Security advisors returned no Food Department findings. Other applications' notices are outside this change's scope.

Executed `scripts/hosted-release-smoke.sql` as a trusted operator, with an existing owner UUID supplied only in the executed request (never committed). It uses `SET LOCAL ROLE authenticated`, real owner RLS and newly generated fixture IDs inside **BEGIN/ROLLBACK**. It is not an OAuth/browser test.

Passed assertions:

1. A 0.5× recipe deducts 400 g from an 800 g input; revert restores 800 g.
2. An explicit 600 g replacement at 0.5× deducts 300 g only from the replacement; revert restores it.
3. Two independent fermentation batches can start; the saved recipe multiplier and container capacity are retained.
4. Retried start/observation requests do not duplicate records.
5. A reported pH/temperature observation and refrigerated/closed stages are recorded; closed logs clear checks and reject later observations.
6. Editing the recipe multiplier leaves the original batch snapshot unchanged.
7. A different owner claim cannot read the fixtures or append to their batches.

The whole transaction rolled back. Subsequent checks found **0 fermentation batches and 0 observations**, with all original-table fingerprints still matching. No test records or test cook deductions were left behind.

## Code and remaining acceptance

- `npm run verify` passes: 153 Jest tests, all component/isolated database regressions, Pages output checker and production build.
- The current `docs/` build is unchanged; feature code was already merged in earlier phases. This phase did not trigger a separate frontend deployment.
- Hosted SQL assertions establish database behavior under authenticated roles. Real browser sign-in, mobile layout, physical-device reopening/persistence, and an actual user's first batch still need acceptance.
- The historical Phase 6 NO-GO due to missing schema is resolved. Device acceptance is not claimed complete.
