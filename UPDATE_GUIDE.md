# 🥘 Feature Update: Emojis, Filters, Ingredient Picker & Category Manager

## What Changed (17 files total)

### 4 New Files
| File | Purpose |
|------|---------|
| `src/config/emoji.js` | Central emoji maps (categories, dish types, country flags) |
| `src/components/ui/FilterBar.jsx` | Reusable filter chip component |
| `src/components/ui/IngredientPicker.jsx` | Category-tabbed ingredient picker modal |
| `src/components/pages/CategoryManagerPage.jsx` | **NEW** Full category management page |

### 12 Updated Files
| File | Changes |
|------|---------|
| `src/App.jsx` | Category manager page routing, handlers for bulk rename/move |
| `src/components/pages/IngredientsPage.jsx` | Emoji on cards, grouped by category, search, filters |
| `src/components/pages/DishesPage.jsx` | Emoji, country + type filter chips |
| `src/components/pages/PrepsPage.jsx` | Emoji, category + status filters |
| `src/components/pages/ShopPage.jsx` | Emoji, category filter |
| `src/components/pages/DataPage.jsx` | "Manage Categories" button added |
| `src/components/forms/DishForm.jsx` | Uses new IngredientPicker, country/type fields |
| `src/components/forms/IntermediateForm.jsx` | Uses new IngredientPicker, category field |
| `src/components/forms/IngredientForm.jsx` | Category dropdown with emoji options |
| `src/components/ui/Icons.jsx` | Added TagIcon + BackIcon |
| `src/index.css` | scrollbar-hide + line-clamp utilities |
| `src/services/db.js` | `bulkRenameCategory()`, `updateIngredientCategoriesByIds()`, dish_type mapping |

### 1 SQL Migration
| File | Purpose |
|------|---------|
| `supabase/004_basic_category.sql` | Recategorizes common items (egg, salt, sugar...) as "🧂 Basic" |

---

## Deployment Steps

### 1. Copy all files into your repo
Drop each file into the matching path in your local project.

### 2. Run SQL migration
In Supabase SQL Editor, run `004_basic_category.sql` to create the Basic category.

### 3. Push to GitHub
```bash
git add .
git commit -m "feat: emoji, filters, ingredient picker, category manager"
git push
```

---

## Feature Summary

### 📦 Ingredients Tab
- Search bar + filter by Category / Stock / Freshness
- Items grouped by category with emoji headers

### 🍽️ Dishes Tab
- Filter by Country (flags) + Type (food emoji)

### 🧑‍🍳 Preps Tab
- Filter by Category + Status

### 🛒 Shop Tab
- Category emoji + filter

### 🥘 Ingredient Picker (Dish & Prep forms)
- Category tabs → see only that category's items
- Search, multi-select, inline quantity, stock info

### 🏷️ Category Manager (Data tab → Manage Categories)
- ✏️ **Rename** — change name + emoji
- 🔀 **Merge** — move ALL items to another category & delete source
- 🗑️ **Delete** — empty categories only
- ☑️ **Select + Move** — expand, check items, move to another category
- **+ New** — create categories to organize items into
