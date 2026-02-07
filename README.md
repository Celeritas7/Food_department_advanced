# 🍳 Cooking App v2 — Supabase + Multi-File Architecture

## Architecture

```
cooking-app/
├── index.html                    # Entry point
├── package.json                  # Dependencies
├── vite.config.js                # Build config
├── tailwind.config.js            # Styling
├── .env.example                  # Supabase credentials template
│
├── supabase/
│   ├── 001_schema.sql            # Database tables + indexes
│   ├── 002_seed.sql              # Seed data from Notion CSVs
│   └── 003_rls_policies.sql      # Row Level Security (public access)
│
└── src/
    ├── main.jsx                  # React entry
    ├── index.css                 # Tailwind CSS
    ├── App.jsx                   # Main app (state, routing, actions)
    │
    ├── config/
    │   └── supabase.js           # Supabase client
    │
    ├── services/
    │   └── db.js                 # All CRUD operations (replaces Dexie)
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
        │   └── Badges.jsx        # Spoilage + Priority badges
        ├── forms/
        │   ├── IngredientForm.jsx
        │   ├── IntermediateForm.jsx
        │   ├── DishForm.jsx
        │   ├── BuyDialog.jsx
        │   └── PrepareDialog.jsx
        └── pages/
            ├── IngredientsPage.jsx
            ├── PrepsPage.jsx
            ├── DishesPage.jsx
            ├── ShopPage.jsx
            └── DataPage.jsx
```

## Setup Steps

### 1. Supabase Database

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Run `supabase/001_schema.sql` — creates all tables
3. Run `supabase/003_rls_policies.sql` — enables public access
4. Run `supabase/002_seed.sql` — loads your Notion data (138 ingredients, 7 intermediates, 51 dishes)
5. Copy your **Project URL** and **anon key** from Settings → API

### 2. App Setup

```bash
# Clone or copy the project
cd cooking-app

# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your actual URL and key

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Deploy to GitHub Pages

```bash
npm run build
# Upload the `dist/` folder to your GitHub Pages repo
```

## Database Schema

| Table | Purpose | Rows (seed) |
|-------|---------|-------------|
| `shops` | Stores (already exists) | 28 |
| `ingredients` | Raw materials | 138 |
| `intermediates` | Base preparations | 7 |
| `dishes` | Final dishes | 51 |
| `dish_ingredients` | Dish ↔ Ingredient links | 230 |
| `dish_intermediates` | Dish ↔ Intermediate links | 6 |
| `intermediate_ingredients` | Prep ↔ Ingredient links | 10 |
| `ingredient_shops` | Ingredient ↔ Shop links | 184 |

## Key Changes from Phase 6

| Before (Single File) | After (Multi-File) |
|---|---|
| Dexie (IndexedDB) | Supabase (PostgreSQL) |
| 1 HTML file, 170 lines | 20+ files, clean separation |
| Client-side only | Cloud database with API |
| Local storage | Persistent across devices |
| No relationships | Proper junction tables |

## Engines (Logic)

- **Availability** → Can this dish be cooked right now?
- **Quantity** → How much of each ingredient do I need total?
- **Priority** → Which ingredients are most urgent to buy?
- **Spoilage** → Is this ingredient expired or expiring soon?

All 52 test scenarios from the spec remain covered.
