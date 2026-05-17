# Food Department — Implementation Phases (refreshed)

Refreshed roadmap with today's design discussion and Phase A shipping baked in.

---

## Phase A — UI polish ✅ SHIPPED

Committed as `58b9e46` on `main`. Live on `celeritas7.github.io/Food_department_advanced`.

**Delivered:**
- Status chip hidden on Planned / In Progress / Cooked / Fridge tabs (visible on Menu Planner + All)
- Priority displayed via card color — 4px left-border stripe + soft background tint
  - high = numeric priority 1–2 (coral `#D97757`)
  - normal = priority 3 (warm tan `#C4B697`)
  - low = priority 4–5 (sage `#7AAD89`)
- Priority legend strip below the tab row
- 2-column CSS grid by default with `⊞ / ≡` toggle in header, persisted in `localStorage.fd_dishes_layout`
- Grid mode: 14px clamped-2-line title, icon-only action buttons
- List mode: full-text action buttons
- Shop tab top-level split: 🥕 Groceries / 🧴 General, persisted in `localStorage.fd_shop_top_tab`
- Existing To Buy / In Stock / Use It Up sub-filters + Expiring + Cook These sit inside Groceries
- General = existing manual non-food shopping list
- Cook These dish cards in Shop also priority-color tinted

**Key learnings:**
- Priority field is numeric (1–5), not string. Implementation correctly bound color variants to numeric ranges.
- GitHub Pages serves from `docs/` folder. Every ship requires `npm run build` + a separate commit of `docs/` artifacts. Src-only commits do not propagate to the live site.

---

## Phase A polish ⏳ PENDING (prompt ready below)

**Why:** running Phase A in production showed dish cards still carry availability/missing info that doesn't help recipe selection — that context belongs on Shop, not Dishes.

**Changes to dish cards on `DishesPage.jsx`:**
1. Remove the "Missing X" chip from the chip row
2. Remove the "N/M ingredients · Missing: X, Y, Z" text line below the chip row
3. Remove the dish type chip (Lunch / Dinner / Side / Side dish) — type filter row remains; the per-card chip is redundant once filtered
4. Hide the country chip when a single country filter is currently active (same logic as the status chip on filtered tabs). Multi-country or no selection: chip stays.

After this, each dish card carries: emoji + title, priority color stripe + bg tint, country chip (when applicable), stored badge (fridge only), action row.

**Engines:** no change — availability calc is still needed for Shop tab.
**Risk:** very low — pure subtraction.

**Paste-ready Claude Code prompt:**

```
Polish for DishesPage.jsx — simplify dish cards for recipe selection.
Missing/availability info belongs on the Shop tab, not here.

Four changes to dish cards:

1. REMOVE the "Missing X" chip from the chip row.
2. REMOVE the "N/M ingredients · Missing: X, Y, Z" text line below the chip row.
3. REMOVE the dish type chip (Lunch/Dinner/Side/etc.) — the type filter row
   stays available; the chip on each card is redundant once filtered.
4. HIDE the country chip when a single country filter is currently active.
   Same logic as the status chip being hidden on a status-filtered tab.
   If no country filter is active OR multiple countries are selected, the
   chip still shows. If exactly one country is filtered and matches the
   card, hide the chip.

After these changes a dish card shows: emoji + title, priority color
stripe + bg tint, ONE chip row with country only (when applicable),
stored badge if in fridge, action buttons.

Do not modify the availability/missing computation in engines — Shop tab
still needs it. Only remove its display from the Dishes page card.

Verify: chip rows are minimal, country chip disappears when one country
filter is active and reappears when filter is cleared.
```

---

## Phase B — Reminder rework + Buy dialog improvements ⏳ PENDING

**Goal:** move reminders out of the Ingredients inventory and into the buying flow. Interval becomes a property of the *purchase*, not the ingredient. Validated by the current "My Reminders" graveyard where 3 of 4 reminders show "Never checked" because the Checked button isn't part of the routine.

### B1. Schema migration
- Store `next_due_date` per reminder (replacing static `interval_days` + `last_checked_at`)
- Migration: `next_due_date = COALESCE(last_checked_at, now()) + interval_days` for existing rows
- Numbered SQL file (e.g. `009_reminder_rework.sql`)

### B2. Buy dialog rework
Current dialog already has a smart "Suggested" qty prefill, purchase date (defaults to today, backdate-able), before/after preview.

**Add:**
- "Remind me in __ days" optional field. If filled: create/update reminder with `next_due_date = today + interval`. If blank: existing reminder untouched.
- **Quick-pick qty chips** below the qty input (today's addition) — tap-to-set, no typing
  - g → `[100] [200] [500] [1000]`
  - ml → `[100] [250] [500] [1000]`
  - piece → `[1] [2] [5] [10]`
  - pack → `[1] [2] [3] [5]`
  - Highlight chip matching "Suggested" value

**Files:** `src/components/forms/BuyDialog.jsx`

### B3. Shop tab — due reminder surface
- New section within Shop → Groceries listing reminders where `next_due_date <= today`
- Each row: ingredient, last purchased, days overdue, quick action buttons
- Exact layout decided once prototypes are live (see C4)

### B4. Ingredients page cleanup
- Delete the "My Reminders" block from the top of the Ingredients page

**Ship criteria:** end-to-end reminder cycle works (Buy → Shop surfaces when due → next Buy resets). Existing reminders migrated cleanly.

---

## Phase C — Prototype review refinements ⏳ PARKED

Decide details with live prototypes from Phase A + B in hand.

### C1. Revert action for Cooked / In Fridge dishes
- Allow moving dishes backwards through the lifecycle (In Fridge → Cooked, Cooked → Planned)
- Open: card button vs Edit-modal-only vs both
- Open: whether revert undoes the stock deduction
- Likely needs an atomic RPC (e.g. `fd_revert_dish`)

### C2. Quick stock-zero on expiring ingredient cards
- On expiring ingredient cards in Shop → Use It Up, add a quick action to zero out stock without leaving the Shop tab
- Open: one-tap "Used Up" with undo toast vs sheet with Used Up / Wasted / Adjust vs inline editable qty
- **Files:** the expiring ingredients component inside `ShopPage.jsx`

### C3. Stock-amount toggle on dish cards (NEW today)
- Optional toggle in `DishesPage` header to show in-stock amount per ingredient on each dish card
- Default: off (minimal cards as per Phase A polish)
- When on: each card expands to show e.g. "Zucchini 400g / need 200g"
- May force list mode when on (grid cards too narrow for ingredient detail)
- Design TBD via prototype review

### C4. Phase B layout fine-tuning
- Position of the reminder section within Shop → Groceries (inline with 🔔 badges in existing list vs dedicated section above)
- Decided once B1–B4 are live

---

## Phase D — Dynamic priority 💤 FUTURE

**Goal:** auto-derive dish priority from the expiry of its required ingredients. Soon-to-expire ingredients automatically rank their dishes higher.

- Manual override remains possible
- Replaces or supplements the current static numeric priority (1–5) field
- Scope + migration approach defined when the phase begins

---

## Phase order rationale

- **A** ✅ — pure frontend, validated the Shop reorg before reminder content lands
- **A polish** next — pure subtraction, ships in minutes
- **B** — schema work, but cleanly scoped. Solves the biggest active pain (broken "My Reminders" graveyard)
- **C** — needs running prototypes from A + B to decide details
- **D** — meaningful design work on its own. Not blocking anything else

---

## Build + deploy reminder

GitHub Pages serves from `docs/`. Every ship requires:

```
npm run build
git add docs/
git commit -m "build: <phase name>"
git push
```

The src/ commit is necessary but not sufficient for live deployment. Always run the build + commit `docs/` separately.
