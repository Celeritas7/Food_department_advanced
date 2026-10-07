# Food Department — Improvement Phases

Companion to `food_department_phases.md` (product roadmap). This file covers
repo health, security, code structure, and UX/accessibility work found in the
October 2026 review. Phases are ordered so each one unblocks the next; product
phases C3 / C4 / D from the other roadmap slot in after Phase 3 here.

Legend: **Effort** is for one developer. **Risk** is to the live site.

---

## Phase 1 — Repo hygiene & one deploy path ⏳ NEXT

**Goal:** a fresh clone installs, tests, builds, and deploys from CI with no
manual `docs/` commit.

**Effort:** half a day · **Risk:** low (no app behaviour changes)

### 1.1 Fix the install
- `npm install` on a clean clone fails: `vite@^8` conflicts with
  `@vitejs/plugin-react@^4` (peer range tops out at Vite 7).
- Bump `@vitejs/plugin-react` to `^5` (or pin `vite` to `^7`), regenerate
  `package-lock.json`, confirm `npm ci && npm test && npm run build` pass.

### 1.2 Delete the snapshot trees
- Remove `Temp/` and `src/#Temp/` (third copy of the app; `#` in the path
  breaks on Windows and in URLs; Jest only ignores one of them).
- Drop the `modulePathIgnorePatterns` entry from `package.json` once gone.

### 1.3 Single deploy pipeline
- Decide: **CI builds and deploys** (recommended). Then:
  - `vite.config.js` → `outDir: 'dist'` (Vite default).
  - `deploy.yml` already uploads `dist/`; switch `npm install` → `npm ci`.
  - Delete `docs/` from the repo and set GitHub Pages source to
    "GitHub Actions".
  - Remove the `deploy` script (`gh-pages -d dist`) from `package.json`.
- Delete the "Build + deploy reminder" section in `food_department_phases.md`
  (no longer true).

### 1.4 Housekeeping
- Add `.claude/settings.local.json` to `.gitignore` and `git rm --cached` it
  (it holds machine-specific Windows paths).
- Refresh `README.md`: add `ExpiryAlertPage`, `RecipePage`, `CookDialog`,
  `__tests__/`, migrations 005–014, remove `Launch_app.bat`.

**Ship criteria:** CI green on a push to `main`, site live from the Actions
artifact, `git status` clean after `npm run build`.

---

## Phase 2 — Security ⏳ PENDING

**Goal:** no secrets in the browser bundle; data not world-writable.

**Effort:** 1 day · **Risk:** medium (auth touches every request)

### 2.1 Move the Claude call server-side
- Create `supabase/functions/parse-recipe/index.ts` (Edge Function). It
  holds `ANTHROPIC_API_KEY` as a Supabase secret and proxies the
  `/v1/messages` call now in `RecipePage.jsx` (~line 538).
- `RecipePage` calls `supabase.functions.invoke('parse-recipe', { body })`
  instead of `fetch('https://api.anthropic.com/...')`.
- Delete `src/config/anthropic.js`, the `VITE_ANTHROPIC_API_KEY` secret in
  `deploy.yml`, and the `anthropic-dangerous-direct-browser-access` header.
- Keep the existing error mapping (no key / 401 / credits) by returning the
  same shape from the function.

### 2.2 Lock down the database
- Enable Supabase Auth with magic-link (email OTP). One user is enough.
- New migration `015_auth_rls.sql`: replace every `USING (true)` policy in
  `003_rls_policies.sql` with `USING (auth.uid() IS NOT NULL)` and the same
  `WITH CHECK`. Apply to tables added in later migrations too
  (`general_shopping_items`, `ingredient_usage_log`, `cook_history`).
- `src/config/supabase.js`: turn `persistSession` / `autoRefreshToken` /
  `detectSessionInUrl` back on.
- Add a minimal `LoginPage.jsx` (email input → "check your inbox") shown
  when there is no session; `App.jsx` renders it before `loadAll()`.
- RPCs (`fd_*` functions) should be `SECURITY INVOKER` so they inherit the
  policies; confirm with `\df+` or the Supabase dashboard.

**Ship criteria:** anon request to any table returns 0 rows; logged-in flow
unchanged; recipe AI import still works end to end.

---

## Phase 3 — Code structure ⏳ PENDING

**Goal:** `App.jsx` under 200 lines; no duplicated UI primitives; no dead
reminder code.

**Effort:** 1–2 days · **Risk:** low–medium (refactor, covered by tests for
engines; add smoke tests for hooks)

### 3.1 Split `App.jsx`
- `src/hooks/useFoodData.js` — `loadAll`, the seven `useState` arrays, the
  enriched `useMemo`s (`enrichedIngredients`, `enrichedDishes`,
  `shoppingList`, `urgentCount`), and a shared `ingById` map.
- `src/hooks/useIngredientActions.js`, `useDishActions.js`,
  `useIntermediateActions.js`, `useGeneralListActions.js` — the handlers,
  each taking `{ db, supabase, setState, notify }`.
- `src/components/ModalHost.jsx` — the 14 `<Modal>` blocks keyed off
  `modal.type`.
- Pages receive an `actions` object instead of 10–15 individual callbacks.

### 3.2 Targeted refetch
- Replace `await loadAll()` after single-row edits with the patch-local
  pattern already used for ingredients. Keep `loadAll()` only for
  junction-changing ops (add/edit dish, add/edit prep, import).

### 3.3 Dedupe UI primitives
- `src/components/ui/priority.js` — single `PRIORITY_COLORS`,
  `priorityVariant`, `priorityCardStyle` (currently copied in `DishesPage`
  and `ShopPage`).
- `src/components/ui/CompletenessRing.jsx` — one component replacing the
  three variants in `DishesPage`, `ShopPage`, `ExpiryAlertPage`.
- `UsedUpPopup` and `RevertPopup` render inside `Modal` (or a shared
  `ConfirmSheet`) rather than re-implementing the backdrop.
- `ConfirmDialog.jsx` replaces the three native `confirm()` calls.

### 3.4 Remove the dead reminder path
- `IngredientsPage` bell button still writes `restock_reminder_days`
  (pre-Phase-B). `handleMarkReminderChecked` is passed but never accepted.
- Either delete the bell (reminders are set only from the Buy dialog, as
  Phase B intended) or make it set `reminder_next_due = today + N`.
- Drop `updateIngredientReminder`, `handleToggleReminder`,
  `handleChangeReminderDays`, `handleMarkReminderChecked` once unused.

### 3.5 Small correctness fixes
- Bottom nav: replace `` `text-${tab.color}` `` with a static class map
  (Tailwind purge can drop dynamic classes).
- Replace the 13 `ingredients.find()` calls inside `.map()` with the shared
  `ingById` map from 3.1.
- `vite.config.js`: add `build.chunkSizeWarningLimit` or lazy-load
  `RecipePage` (1,487 lines) with `React.lazy` — it's only needed on demand.

**Ship criteria:** all 56 engine tests still pass; manual smoke of every
page; `App.jsx` ≤ 200 lines.

---

## Phase 4 — UX consolidation ⏳ PENDING

**Goal:** one home for each job; fewer surprises on first use.

**Effort:** 1–2 days · **Risk:** medium (navigation changes are visible)

### 4.1 Merge Expiry and Use It Up
- `ExpiryAlertPage` and Shop → Use It Up show the same data (expiring
  ingredients, "cook these", Used Up flow).
- Keep the **Expiry tab** as the hero. In Shop → Groceries, replace the Use
  It Up sub-tab with a one-line banner "N items expiring → Expiry" that
  deep-links there.

### 4.2 Bottom navigation
- Six tabs → five: **Expiry · Dishes · Shop · Ingredients · More**.
- "More" opens Preps, Data, Category Manager (sheet or sub-page).
- Default landing (`fd_page`) stays Dishes.

### 4.3 Feedback & error states
- `Toast` becomes a queue (max 3 visible, newest at top) so rapid actions
  don't overwrite each other; `UndoToast` joins the same stack at a fixed
  slot above the nav.
- Loading screen gets a timeout + "Retry" button and an inline error panel
  when Supabase is unreachable, instead of a toast over a blank page.
- `ConfirmDialog` from Phase 3 replaces native `confirm()` for deletes.

### 4.4 First-run guidance
- Empty state on Dishes when there are also zero ingredients: short
  three-step card (Add ingredients → Add a dish → Plan it) with buttons.
- Empty state on Shop when nothing is In Progress already exists; add the
  same button pattern.

### 4.5 Filter persistence rule
- Pick one: **all list filters persist in `sessionStorage`** (Dishes already
  does; apply to Ingredients and Shop). Document the key prefix `fd_`.

**Ship criteria:** no duplicate expiring list; nav fits a 360 px phone with
labels visible; killing the network shows a retry panel.

---

## Phase 5 — Accessibility & responsive ⏳ PENDING

**Goal:** keyboard and screen-reader usable; good on phone, tablet, laptop.

**Effort:** 1 day · **Risk:** low

### 5.1 Dialogs
- `Modal`, `UsedUpPopup`, `RevertPopup`, `CookDialog`: add
  `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape to close, focus
  trap, return focus to the opener, body scroll lock.
- Status dropdown on dish cards: arrow-key navigation, `aria-expanded`.

### 5.2 Layout
- Dish grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` instead of the
  inline `1fr 1fr`.
- Grid-mode action row: cap at four actions; overflow into a "⋯" menu so
  cards don't wrap at 320 px.
- Minimum touch target 44 × 44 px for all icon buttons (several are
  `p-1.5` today).

### 5.3 Icons
- Replace emoji action glyphs (✅ 🧊 🗑️ ↩ 🍳) with SVGs in `Icons.jsx` for
  consistent rendering; keep emoji for categories and dish types where
  they carry meaning.
- Every icon-only button has `aria-label` (16 today; audit the rest).

### 5.4 Colour tokens
- Move the hex literals in `DishesPage`, `ShopPage`, `ExpiryAlertPage`
  rings and priority styles into `tailwind.config.js` colours so Phase 6
  dark mode is a config change.

**Ship criteria:** axe DevTools reports 0 serious issues on each page;
Lighthouse accessibility ≥ 95; manual keyboard-only pass through Buy and
Cook flows.

---

## Phase 6 — Polish & performance 💤 LATER

- Dark mode via Tailwind `dark:` using the Phase 5 tokens.
- Code-split `RecipePage`, `DishForm` parsers, and `CategoryManagerPage`
  (bundle is 543 kB minified today).
- Optional PWA manifest + service worker so the app opens offline with the
  last-loaded data (sessionStorage already restores navigation state).
- Usage-log analytics ("how much did we waste this month") on the Data
  page, using `ingredient_usage_log` from migration 012.

---

## Order rationale

1. **Phase 1** — nothing else can ship reliably while a clean install fails
   and deploys need a hand-committed `docs/`.
2. **Phase 2** — the API key and open RLS are the only items with real-world
   cost if left; do them before adding more features.
3. **Phase 3** — the hook split makes Phases 4–5 (and product C3/C4/D)
   cheaper to build and review.
4. **Phase 4** then **Phase 5** — visible UX first, then the accessibility
   pass over the final layout so it's done once.
5. **Phase 6** — nice-to-haves that depend on the tokens and structure above.

Product phases **C3** (stock-amount toggle), **C4** (reminder layout) and
**D** (dynamic priority) fit best after Phase 3 and before Phase 5.
