# Phase 2 — Recipe scaling

Built from main after Phase 1 was merged in PR #15. No production database changes are made by this branch.

## What changes

The recipe page has Half, Original, Double, and custom batch controls. You can also set original/wanted servings or choose a linked ingredient and enter your target amount in its recipe unit. An 800 g cabbage recipe scaled to 400 g selects a 0.5× batch.

The multiplier is saved as `recipe_data.batchScale`; original serving count, when supplied, is `recipe_data.baseServings`. Original junction quantities and JSON ingredient snapshots remain unchanged. Old recipes without a multiplier use 1×. Supported multipliers are finite, greater than zero, and at most 1000.

Availability, shopping totals, preparation deficits, dish stock details, recipe quantity badges and Cook defaults all use the selected batch. Unit conversion follows Phase 1 rules. Cooking sends actual displayed pantry amounts, so the server does not multiply overrides again. The legacy recipe-driven cook RPC applies the multiplier once and retains the existing exact-revert snapshot behavior.

Recipe quantity edits use the original batch; the inline quantity shortcut is disabled in a scaled view. Switching to Original or entering recipe editing lets you change base quantities. Fractional pieces/eggs remain visible and are not rounded automatically.

Recipe text, unlinked ingredient amounts, cooking times and nutrition prose are not rewritten. The UI explains that the quantity badges are the selected-batch amounts and that written numbers need review. A batch change never adjusts the pantry balance itself.

Recipe writes use one save queue so checkbox saves cannot overtake a batch save. Failed batch saves leave an explicit unsaved-preview warning, keep the desired multiplier available for retry, and do not claim that shopping totals have updated. Back/Edit are disabled while a batch save is in flight.

## Verification

- `npm test -- --runInBand`: 116 tests, including new scaling and save-queue regressions.
- `npm run test:scaling-ui`: component interactions for presets, invalid input, ingredient targets, serving targets, failed saves and retries, scaled Cook defaults and payloads, overdraw blocking, unchanged base links, scaled badges and reset to original.
- `npm run test:pantry-db`: real migrations in isolated PGlite/PostgreSQL; scaled ingredients and preparations, no second multiplication of actual overrides, exact reverts, invalid multiplier rejection, and existing stock/RLS regressions.
- `npm run build`: matching GitHub Pages output in `docs/`.
- `git diff --check`.

The browser could not reach the workspace preview. Component interactions are verified; real-browser layout and physical-device acceptance remain unverified. Tests do not modify production data.

## Release dependency

A read-only check of General_apps on November 19, 2026 found that Phase 1's `stock_status` and `unit_conversions` columns were still absent. Merging PR #15 did not apply its SQL migration.

Before releasing this branch, take a current database backup, then apply these in order:

1. `supabase/migrations/20261119123058_accurate_pantry_calculations.sql`, after the existing owner/RLS migrations.
2. `supabase/migrations/20261119125254_recipe_batch_scaling.sql`.
3. Merge/deploy this branch's matching `docs/` build.

The Phase 2 migration only replaces the existing SECURITY INVOKER legacy cook function. It adds no table, changes no owner policy/grant, and rewrites no stored recipe amounts. Existing callers without batch metadata retain 1× behavior.

Signed-in acceptance: scale 800 g cabbage to 400 g; confirm shopping/availability and Cook show 400 g; cook and revert; reopen to confirm persistence; reset to Original and confirm 800 g; try a fractional serving count and a failed save. Review cooking time, instructions and container capacity for the new batch yourself.
