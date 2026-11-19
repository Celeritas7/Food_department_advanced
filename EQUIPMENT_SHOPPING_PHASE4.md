# Phase 4 — Equipment, containers and shopping notes

Built from main after Phase 3 (PR #17). No production database changes are made by this branch. Phase 4 stores its data in the existing recipe JSON and needs no additional SQL migration.

## Equipment per recipe

The recipe page has an Equipment & shopping notes panel. Record containers, pans, tools or appliances; count; Have/Need/Check status; material; heat-source compatibility; care instructions; and free notes. These are recipe-specific planning records, not a shared physical inventory. Counts stay fixed when a batch is scaled, and no equipment quantity enters food stock or deductions.

The Shopping page has an Equipment view for In Progress recipes. It keeps entries per recipe rather than merging jars that might be needed simultaneously, shows Need/Check items first by excluding ready items by default, and opens the source recipe for review. Ready equipment can be included. The existing General shopping list remains separate.

Cook shows equipment that needs review. Equipment readiness is advisory; ingredient/preparation availability and the transactional cooking RPC remain the stock-validation rules. An equipment warning does not automatically block a user's cooking confirmation.

## Container volume checks

For a container, optionally record capacity per item in ml, total fill volume for the original 1× recipe in ml, and the percentage of capacity to leave empty. The app does not infer volume from cabbage weight or choose a fermentation headspace percentage.

`selected fill = original fill × batch multiplier`

`minimum combined capacity = selected fill / (1 - empty-space percentage / 100)`

`available combined capacity = capacity per item × container count`

A recorded 900 ml fill with 20% empty space needs 1125 ml combined capacity at 1×, so a 1 L jar is flagged. At 0.5× it needs 562.5 ml, and the same 1 L jar passes the recorded-volume check. Containers themselves do not become smaller or more numerous automatically.

If measurements are missing, the app asks for a fit check. Manual confirmation is saved for the selected multiplier only and expires when batch size changes. Editing volume/count fields clears confirmation. A manual confirmation cannot hide a known capacity shortfall. Multiple containers are assessed by combined volume; actual shape, opening size and practical fit still need review. This is planning arithmetic, not fermentation-process validation.

Recipe re-import retains equipment/purchasing records but marks container fit as Check and clears manual fit confirmation, because the underlying recipe may have changed.

## Purchasing notes

Equipment and linked ingredients can carry shop, recorded price in yen, pack size/price basis, date, product/shop URL and notes. Prices are explicitly recorded observations, not live quotes or automatic recommendations. Free/zero-price observations remain zero. Only http/https URLs without embedded login details are accepted, and unsafe imported links are not rendered.

Grocery shortage rows show notes for the current ingredient ID in active recipes and link to the recipe editor. Notes for a previous substituted ingredient do not appear as notes for its replacement. Food quantities are not changed by prices, pack sizes or equipment counts. Notes remain visible on the recipe and travel with the recipe's JSON export.

Supplies saves use the existing serial recipe-save queue, preserve unrelated recipe metadata, and keep failed editor drafts for retry. The recipe is temporarily non-interactive during a supplies save so older edits cannot overtake it.

## Validation

- `npm test -- --runInBand`: 143 Jest tests, including volume/batch arithmetic, missing measurements, manual fit expiry, known shortfalls, multiple containers, invalid inputs/URLs, active recipe filtering, ingredient identity after substitution and unchanged food shopping quantities.
- `npm run test:supplies-ui`: equipment editing, scaled capacity/fit, purchasing notes, unsafe URLs, failed-save retention, shopping navigation, recipe metadata preservation, re-import retention/re-check and food-only Cook deductions.
- `npm run test:scaling-ui`, `npm run test:identity-ui`, `npm run test:pantry-db`: previous-phase regressions.
- `npm run build`: matching GitHub Pages files in `docs/`; `git diff --check`.

Real-browser layout/physical-device acceptance remain unverified because the workspace preview was inaccessible in previous attempts. Component interactions are verified separately; no claim of visual acceptance is made.

## Release dependency

Phase 4 requires no new migration, but earlier source merges do not apply SQL. Before releasing this frontend, verify and apply the pending Phase 1–3 database migrations after a current backup, in order:

1. `20261119123058_accurate_pantry_calculations.sql`
2. `20261119125254_recipe_batch_scaling.sql`
3. `20261119131750_ingredient_aliases_substitutions.sql`

Then merge/deploy the matching `docs/` build and perform signed-in acceptance: add a container, change batch size, record an ingredient shop/pack/price/date, reopen the app, check Shopping → Equipment and the relevant grocery note, simulate a failed save, and confirm cooking deducts only food. The current draft does not deploy or modify production data.
