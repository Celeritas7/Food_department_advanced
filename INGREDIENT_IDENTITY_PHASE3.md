# Phase 3 — Ingredient aliases and substitutions

Built from main after PR #16. No production database writes or deployment are performed by this branch.

## Alternate names

Ingredient editing now accepts alternate names separated by commas or new lines, for example `nước mắm, ナンプラー` on a Fish sauce record. Names remain attached to that one pantry ID; they do not create extra stock balances. Names/aliases are included in search, ingredient pickers and recipe import matching, and survive full-row exports and bulk imports.

Automatic linking requires one exact normalized name or registered alias. Normalization handles case, spacing, punctuation, Latin accents and full-width characters while preserving Japanese voiced/unvoiced distinctions. Partial names still help manual search but never automatically identify an ingredient. If two pantry records share a name/alias, the user must choose the correct one. Ambiguous CSV/AI-import names are not used to create duplicate pantry items automatically.

There are no pre-seeded culinary equivalences, automatic ingredient merges or automatic stock transfers. Aliases describe the same ingredient; substitutions describe a deliberate recipe change.

## Recipe substitutions

The recipe page has a Recipe substitutions panel. Select a current recipe ingredient, choose a different pantry item, enter a replacement amount/unit for the original 1× recipe, optionally add a taste/preparation note, and confirm the choice. The amount starts blank; changing the amount or unit clears confirmation. The selected-batch preview uses Phase 2 scaling.

Ingredients already linked to the recipe are excluded. A replacement is saved atomically by `fd_substitute_dish_ingredient`: the quantity link, JSON ingredient identity/snapshot and substitution history change together. Recipe text and unrelated recipe data are preserved; the display shows the actual linked ingredient as “Using: …” when it differs from the written name. History keeps the previous identity/amount/unit and the replacement choice/note.

Making a substitution does not change pantry stock. Availability, shopping and cooking then use the replacement's pantry ID and confirmed amount, including existing scaling and unit-conversion checks. Cooking/reverting only deducts/restores the replacement. No substitution ratio or density is guessed, and no nutritional/taste equivalence is promised.

The RPC uses existing owner RLS and SECURITY INVOKER behavior, locks the recipe and relevant rows, rejects stale original links and duplicate replacements, validates positive finite amounts, and refuses to change Cooked/In Fridge recipes or recipes with pending cook snapshots. There is no automatic substitution chain. To choose a previous ingredient again, make another explicit replacement using the amount recorded in history.

The page flushes queued recipe saves before substitution and temporarily disables interaction while the change is saving. The application updates from the atomic response rather than requiring another network read before acknowledging success.

## Checks

- `npm test -- --runInBand`: 127 Jest tests, including exact alias resolution, Unicode normalization, ambiguity, safe partial search and alias-editor validation.
- `npm run test:identity-ui`: component interactions for alias editing/search, ambiguous CSV imports, duplicate exclusion, blank replacement amounts, confirmation reset, selected-batch preview, failure handling, save ordering and replacement display/history.
- `npm run test:scaling-ui`: Phase 2 component regressions.
- `npm run test:pantry-db`: isolated PostgreSQL/PGlite with the real migrations. Includes alias constraints, scaled replacement cooking/revert, stock unchanged at substitution, stale/duplicate/cooked recipe rejection, rollback after a forced failure on the second write, and cross-owner/anonymous rejection.
- `npm run build` and `git diff --check`.

Real-browser layout and physical-device acceptance remain unverified because preview connectivity was unavailable in the preceding phases. Component checks do not replace visual acceptance.

## Release order

A read-only General_apps check on November 19, 2026 still found no `stock_status`, `unit_conversions` or `aliases` columns. Source merges do not apply database migrations. Take a current backup, then apply the existing owner migrations and these migrations in order before releasing the matching frontend:

1. `20261119123058_accurate_pantry_calculations.sql`
2. `20261119125254_recipe_batch_scaling.sql`
3. `20261119131750_ingredient_aliases_substitutions.sql`

Phase 3 adds an empty aliases column with validation and one owner-scoped substitution RPC. It does not populate aliases or alter existing stock/recipe links on migration. Review the draft PR and perform signed-in acceptance before merging/deploying its `docs/` output.

Acceptance example: add nước mắm as an alternate name for Fish sauce; search/import it and confirm it uses the existing record. In a test recipe, explicitly replace 10 ml fish sauce with your chosen 30 ml replacement amount at 1×, then select 0.5×. Confirm the recipe/shopping/Cook use 15 ml of the replacement, substitution alone leaves stock unchanged, and cook/revert restores the exact replacement balance. This example tests accounting and is not a culinary ratio recommendation.
