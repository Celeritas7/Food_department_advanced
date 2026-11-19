# Phase 1 — Accurate pantry calculations

Implemented on `feat/accurate-pantry-calculations`. Production database and main branch have not been changed.

## Behavior

- Availability, shopping totals, recipe stock badges, cooking and preparation use pantry units.
- Grams/kilograms and milliliters/liters convert automatically. Common spelling and count-unit aliases normalize.
- Spoons, cups, packs, cloves/bulbs, and mass/volume conversions require a confirmed conversion for that particular ingredient. No density or regional cup size is guessed.
- Ingredient editing supports **Measured quantity**, **Have it, quantity unknown**, and **Check stock**. Unknown quantities produce a shopping **Check** action instead of a numeric buy suggestion. That action opens the ingredient editor, including its conversion settings.
- Cook shows recipe quantities separately and deducts the displayed pantry quantity. The RPC converts the supplied unit using current locked ingredient data, validates every row, refuses duplicate/changed recipe links and stores the actual deduction snapshot for exact revert.
- A purchase does not turn an unknown old balance into a measured total. Measure and update the total explicitly.
- Pantry units cannot change while a reversible cook snapshot references the ingredient. Finish or revert that dish first. Other unit changes clear stale conversion factors and preserve the old unit on legacy recipe links so their quantities cannot be reinterpreted. Preparation and dish pickers retain recipe units while editing.
- Duplicate recipe links using different units are rejected before junction writes, preventing additions such as `2 tbsp + 20 g = 22 tbsp`.
- Legacy links with no recipe unit still mean pantry units. Positive historical quantities remain usable even if `in_stock` was false. Zero quantities historically marked present become **Have it, quantity unknown**. Null quantities become **Check stock**. The migration synchronizes the old presence flag without rewriting quantities.

## Validation

- `npm ci --legacy-peer-deps` (existing Vite 8 / React plugin 4 peer-range conflict requires this flag).
- `npm test -- --runInBand`: 96 tests, including mixed units, unknown quantities, direct and preparation needs, and consistency of availability/shopping/deductions.
- `npm run test:pantry-db`: isolated PGlite/PostgreSQL database; real baseline, workflow and owner migrations; conversion parity with JavaScript; failed-operation rollback; legacy and override cooks; exact revert; preparation; purchases; owner RLS; cross-user and anonymous rejection. No live user data is written by this script.
- `npm run build`: refreshed `docs/`, the GitHub Pages output.
- Browser validation attempted but unavailable: local Chromium could not launch in this execution environment and the connected browser could not reach the local preview. Mobile visual/interaction acceptance remains outstanding.

## Release order

1. Review the source and migration; take a current backup of General_apps before applying schema changes.
2. Apply `supabase/migrations/20261119123058_accurate_pantry_calculations.sql` after the existing `017_owner_rls.sql` changes. Functions remain SECURITY INVOKER; existing owner policies are retained.
3. Merge this branch to release the matching `docs/` build. The new frontend needs the added columns; do not release it ahead of the migration.
4. In the signed-in app, confirm these cases: 100 g sugar with a confirmed 12 g/tbsp conversion and a 2 tbsp recipe shows 24 g used and 76 g remaining; revert restores 100 g; quantity unknown opens Check; 0.1 kg + 25 g across active recipes yields 125 g required; preparations use the same units.

The database test is local and does not prove concurrent hosted behavior. RPCs retain row locks and transaction rollback; hosted smoke testing and real-device acceptance are release checks. Ingredient names/aliases, recipe scaling, shopping prices, and fermentation tracking belong to later phases.
