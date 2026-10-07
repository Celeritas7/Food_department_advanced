# 🍳 Food Department — Cooking App

Personal kitchen manager: ingredients, preparations, dishes, shopping and
expiry tracking. React + Vite + Tailwind front end, Supabase (Postgres)
back end, deployed to GitHub Pages by GitHub Actions.

Live: <https://celeritas7.github.io/Food_department_advanced/>

Roadmaps: [`food_department_phases.md`](food_department_phases.md) (product) ·
[`improvement_phases.md`](improvement_phases.md) (repo health, security, UX).

## Features

- 🚨 **Expiry** — Expiring ingredients matched to dishes you can cook now; "Used up / Wasted" with undo
- 📦 **Ingredients** — Search, filter by category / stock / freshness, emoji grouping, inherited priority
- 🍽️ **Dishes** — Menu Planner ranked by completeness; Planned → In Progress → Cooked → In Fridge → Eaten lifecycle with one-step revert; grid / list layout
- 📖 **Recipes** — Collapsible recipe view and editor, AI import (Claude) or offline quick-parse
- 🍳 **Cook dialog** — Override recipe quantities at cook time so stock stays accurate
- 🛒 **Shop** — Groceries (To Buy / In Stock / Use It Up, due reminders) and a General non-food list
- 🧑‍🍳 **Preps** — Intermediate preparations (dough, sauces) with their own stock
- 🏷️ **Data** — JSON export / import, Category Manager (rename, merge, move)

## Project structure

```
├── index.html
├── package.json / package-lock.json
├── vite.config.js · tailwind.config.js · postcss.config.js
├── .env.example                  # Supabase + Anthropic env template
├── .github/workflows/deploy.yml  # Test → build → deploy to Pages
├── supabase/                     # SQL migrations, run in order
└── src/
    ├── main.jsx · App.jsx · index.css
    ├── config/      supabase.js · anthropic.js · emoji.js
    ├── services/    db.js                    # All Supabase CRUD + RPC calls
    ├── engines/                              # Pure logic, unit-tested
    │   ├── availability.js                   # Can this dish be cooked now?
    │   ├── quantity.js · quantityAggregation.js  # Shopping list totals
    │   ├── priority.js · priorityPropagation.js  # Dish → ingredient priority
    │   ├── spoilage.js                       # Expired / near expiry
    │   ├── storageAtomicity.js · workflowActions.js  # Atomic RPC wrappers
    │   ├── importSync.js                     # JSON import reconciliation
    │   └── __tests__/                        # Jest suites
    └── components/
        ├── ui/      Modal · Toast · UndoToast · Badges · FilterBar · Icons ·
        │            IngredientPicker · RevertPopup · UsedUpPopup
        ├── forms/   IngredientForm · BuyDialog · IntermediateForm ·
        │            PrepareDialog · DishForm · CookDialog
        └── pages/   ExpiryAlertPage · IngredientsPage · DishesPage ·
                     DishManagerPanel · RecipePage · ShopPage · PrepsPage ·
                     DataPage · CategoryManagerPage
```

## Local development

```bash
cp .env.example .env     # fill in your Supabase URL + anon key
npm ci
npm run dev              # http://localhost:5173/Food_department_advanced/
npm test                 # engine unit tests
npm run build            # production build into dist/
```

## Database setup (Supabase)

In the Supabase **SQL Editor**, run the files in `supabase/` in numeric order:

| File | Purpose |
|---|---|
| `001_schema.sql` | Core tables and indexes |
| `002_seed.sql` | Seed data |
| `003_rls_policies.sql` | Row Level Security (currently open access, tightened in improvement Phase 2) |
| `004_basic_category.sql` | Recategorise common staples as "Basic" |
| `008_recipe_data.sql` | `recipe_data` JSONB on dishes |
| `009_atomic_workflow.sql` | Atomic prepare / buy / cook / store / eat RPCs |
| `010_buy_with_purchase_date.sql` | Backdated purchases |
| `011_reminder_rework.sql` | `reminder_next_due` + backfill |
| `012_ingredient_usage_log.sql` | Used-up / wasted log |
| `013_fd_revert_dish.sql` | One-step dish revert RPC |
| `014_fd_cook_dish_with_overrides.sql` | Cook with quantity overrides |

> ⚠️ Migrations **005–007 are not in the repo**. They were applied directly
> to the live database and added at least the general shopping list table,
> the reminder columns (`has_reminder`, `restock_reminder_days`,
> `last_reminder_checked`) and the ingredient `emoji` column. A fresh project
> built only from these files will be missing them; export them from the live
> database before relying on this for a rebuild.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci` →
`npm test` → `npm run build` → publish `dist/` to GitHub Pages. Pull
requests run the same test and build steps without deploying. Nothing
build-related is committed.

One-time repository settings:

1. **Settings → Pages → Build and deployment → Source:** `GitHub Actions`
2. **Settings → Secrets and variables → Actions:** `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `VITE_ANTHROPIC_API_KEY`

The workflow refuses to deploy if the Supabase URL secret is missing. It can
also be run by hand from the **Actions** tab (`workflow_dispatch`).
