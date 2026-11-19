# Phase 5 — Fermentation batch tracking

Implemented on top of Phase 4. Open a recipe → **Fermentation batches** → **Start a batch log**. **Data → Open batch logs** shows active and archived batches across recipes, including records whose source recipe was deleted.

## Behavior

- Multiple independent batches per recipe, named and timestamped in local time (stored as timestamptz; displayed with timezone).
- Starting a batch saves the current recipe first, then snapshots the server's recipe, selected batch multiplier, planned ingredient/preparation amounts, and selected container. A manual container description is allowed; capacity is never inferred from it.
- Later edits, substitutions, scaling, and recipe deletion do not rewrite starting snapshots. Deletion detaches the recipe link while preserving batch history.
- Append observations with optional reported pH (0–14), finite temperature in °C, notes, stage changes, and an optional next-check date. Corrections use another observation; entries cannot be edited or deleted through the authenticated API.
- Stages: fermenting, refrigerated, closed, discarded. Closing/discarding clears the next check and makes the log read-only in the app. It does not certify that food is ready, safe, or edible.
- Next checks are visible as scheduled/overdue in the tracker, refreshed each minute. No background notifications or external reminders are created.
- Elapsed time and pH are observations only. The app does not calculate a safety or readiness rating, prescribe fermentation duration, or use a pH threshold as a safety guarantee.
- Starting/logging a batch does not change pantry stock, dish status, or cook history. Use the existing Cook workflow to record ingredient consumption.

## Storage and reliability

`food_department_fermentation_batches` and `food_department_fermentation_entries` have authenticated owner RLS. Recipes are checked against the caller's owner ID. Entry ownership is tied to its batch with a composite foreign key. RPCs are SECURITY INVOKER with a pinned search path; anonymous/public execution is revoked. Snapshots are immutable and entry UPDATE/DELETE privileges are revoked. Account deletion can still cascade to its logs.

Start requests use a client-generated UUID and a transaction advisory lock. Append requests lock the batch row. Repeating the same request returns the existing record; reusing an ID with changed details fails. Entry insert and stage/check updates commit atomically. UI double submissions are guarded and failed requests keep the draft and request ID; editing creates a new ID. These are online server records, not an offline queue. Refresh avoids overwriting a newer local mutation response with an older list response.

Recipe panels load logs only when opened, so pending fermentation schema does not block core app startup. Missing tables/functions produce a database setup message; network errors retain their own message. Loading errors are not treated as an empty log. List reads page past the server row cap and use stable unique ordering.

JSON export is version 3 and includes `fermentation: { batches, entries }`. Export fails explicitly if these records cannot be read, rather than silently producing an incomplete backup. This phase does not implement server-side backup restore; the existing Data import behavior is unchanged.

The database permits owner-scoped direct inserts/updates needed by invoker RPCs; the app's append/stage workflow and idempotency are enforced by the RPCs. Starting snapshots and terminal-state changes are also protected by a trigger. No administrative/security-definer bypass is introduced.

## Validation

- Jest: 153 tests, including date/reading validation, stage rules, due labels, retry merging, API normalization, setup errors and scoped paging.
- `npm run test:fermentation-db`: isolated PGlite/PostgreSQL with real baseline, prior migrations, owner migrations, and Phase 5. Checks independent batches, snapshot scaling, unchanged stock, retries, invalid readings/timestamps/stages, backdated observations, cleared checks, terminal logs, snapshot immutability, recipe deletion, append-only permissions, two-owner isolation, anonymous denial, and rollback when a batch update fails. Concurrent production clients have not been exercised; serialization is implemented through database locks.
- `npm run test:fermentation-ui`: component interactions for lazy loading, failure retention, stable retry IDs, due labels, reported readings, closed history, and save-before-start (including failed recipe save blocking the start).
- Existing pantry SQL and scaling/identity/supplies component regression scripts pass.
- Production build in `docs/`; `git diff --check`.

Real-browser layout and physical-device acceptance remain pending; workspace preview access was unavailable. No production data was changed.

## Release dependencies

Earlier source merges do not apply SQL. Prior read-only checks on November 19 found the Phase 1–3 migrations still pending in General_apps. Before releasing this frontend, verify database state, take a current backup, then apply the pending migrations after existing 016/017 owner migrations:

1. `20261119123058_accurate_pantry_calculations.sql`
2. `20261119125254_recipe_batch_scaling.sql`
3. `20261119131750_ingredient_aliases_substitutions.sql`
4. `20261119150000_fermentation_batches.sql`

Then deploy the matching `docs/` build. This branch does not apply migrations, merge itself, or deploy production.

Signed-in acceptance: start two batches from one recipe, select a container, record a pH/temperature/note, move one batch to refrigerated, set/clear a next check, reopen the app, change the recipe scale and verify old snapshots remain unchanged, export JSON and confirm both histories, then close one log and find it under Closed/discarded. Repeat under another account to verify isolation. Review mobile layout and local timezone display.
