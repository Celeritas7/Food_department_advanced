# 🍳 Cooking App v2 — Supabase + Multi-File Architecture

## Architecture

```
cooking-app/
├── index.html                    # Entry point
├── package.json                  # Dependencies
├── vite.config.js                # Build config
├── tailwind.config.js            # Styling
├── postcss.config.js             # PostCSS config
├── .env.example                  # Supabase credentials template
├── Launch_app.bat                # Windows launcher
│
├── .github/workflows/
│   └── deploy.yml                # Auto-deploy to GitHub Pages
│
├── supabase/
│   ├── 001_schema.sql            # Database tables + indexes
│   ├── 002_seed.sql              # Seed data from Notion CSVs
│   ├── 003_rls_policies.sql      # Row Level Security (public access)
│   └── 004_basic_category.sql    # Recategorize common staples as "Basic"
│
└── src/
    ├── main.jsx                  # React entry
    ├── index.css                 # Tailwind CSS
    ├── App.jsx                   # Main app (state, routing, actions)
    │
    ├── config/
    │   ├── supabase.js           # Supabase client
    │   └── emoji.js              # Central emoji maps (categories, types, flags)
    │
    ├── services/
    │   └── db.js                 # All CRUD operations
    │
    ├── engines/
    │   ├── availability.js       # Per-dish cookability check
    │   ├── quantity.js           # Aggregate shopping list
    │   ├── priority.js           # Priority propagation
    │   └── spoilage.js           # Expiry calculation
    │
    └── components/
        ├── ui/
        │   ├── Icons.jsx         # SVG icons
        │   ├── Modal.jsx         # Modal dialog
        │   ├── Toast.jsx         # Toast notifications
        │   ├── Badges.jsx        # Spoilage + Priority badges
        │   ├── FilterBar.jsx     # Reusable filter chips
        │   └── IngredientPicker.jsx # Category-tabbed ingredient picker
        ├── forms/
        │   ├── IngredientForm.jsx
        │   ├── IntermediateForm.jsx
        │   ├── DishForm.jsx
        │   ├── BuyDialog.jsx
        │   └── PrepareDialog.jsx
        └── pages/
            ├── IngredientsPage.jsx     # With emoji, search, multi-filters
            ├── PrepsPage.jsx           # With category/status filters
            ├── DishesPage.jsx          # With country/type filters
            ├── ShopPage.jsx            # With category filter
            ├── DataPage.jsx            # Import/export + category manager link
            └── CategoryManagerPage.jsx # Rename, merge, move categories
```

## Features

- 📦 **Ingredients** — Search, filter by category/stock/freshness, emoji grouping
- 🧑‍🍳 **Preparations** — Dough, sauces with category/status filters
- 🍽️ **Dishes** — Plan & cook with country flags and type filters
- 🛒 **Shopping** — Auto-generated list with category filters
- 🏷️ **Category Manager** — Rename, merge, delete, move items between categories
- 🥘 **Ingredient Picker** — Category-tabbed modal for selecting ingredients

## Engines

- **Availability** → Can this dish be cooked right now?
- **Quantity** → How much of each ingredient do I need total?
- **Priority** → Which ingredients are most urgent to buy?
- **Spoilage** → Is this ingredient expired or expiring soon?

All 52 test scenarios from the spec remain covered.

## Setup

### 1. Supabase Database

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Run `supabase/001_schema.sql` — creates all tables
3. Run `supabase/003_rls_policies.sql` — enables public access
4. Run `supabase/002_seed.sql` — loads your Notion data
5. Run `supabase/004_basic_category.sql` — recategorizes common staples
6. Copy your **Project URL** and **anon key** from Settings → API

### 2. App Setup

```bash
cd Food_department_advanced
cp .env.example .env
# Edit .env with your actual Supabase URL and key
npm install
npm run dev
```

### 3. Deploy to GitHub Pages

Set GitHub Secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

```bash
git add .
git commit -m "deploy"
git push
```

GitHub Actions auto-builds and deploys to Pages.
