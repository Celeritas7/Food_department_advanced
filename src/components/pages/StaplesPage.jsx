/**
 * StaplesPage.jsx — Restock reminders for ingredients flagged is_staple.
 *
 * Reads `is_staple`, `min_stock_qty`, `restock_reminder_days`, and
 * `last_reminder_checked` off ingredient rows. Splits items into:
 *   🔴 Needs Attention — overdue or never checked
 *   🟢 Recently Checked — within the per-ingredient reminder interval
 */
import { useMemo } from 'react';
import { PkgIcon } from '../ui/Icons';
import { getCatEmoji } from '../../config/emoji.js';

const REMINDER_OPTIONS = [3, 7, 14, 30];
const DEFAULT_INTERVAL = 7;
const MS_PER_DAY = 86400000;

function daysSince(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / MS_PER_DAY);
}

// Returns one of: 'never' | 'overdue' | 'due-soon' | 'ok'
function reminderStatus(ing) {
  const interval = ing.restock_reminder_days || DEFAULT_INTERVAL;
  const since = daysSince(ing.last_reminder_checked);
  if (since == null) return 'never';
  if (since >= interval) return 'overdue';
  if (since >= interval - 1) return 'due-soon';
  return 'ok';
}

function StatusBadge({ status }) {
  if (status === 'never') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-tomato/10 text-tomato border border-tomato/20">🔴 Never checked</span>;
  if (status === 'overdue') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-tomato/10 text-tomato border border-tomato/20">🔴 Overdue</span>;
  if (status === 'due-soon') return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-butter/60 text-yellow-800 border border-yellow-300">🟡 Due soon</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sage/10 text-sage border border-sage/20">🟢 OK</span>;
}

function StapleCard({ ing, onChangeInterval, onMarkChecked, onBuy }) {
  const status = reminderStatus(ing);
  const since = daysSince(ing.last_reminder_checked);
  const interval = ing.restock_reminder_days || DEFAULT_INTERVAL;
  const min = ing.min_stock_qty;
  const lowStock = min != null && ing.stock_qty < min;

  return (
    <div className={`bg-white rounded-xl border p-4 ${
      status === 'overdue' || status === 'never' ? 'border-tomato/30' :
      status === 'due-soon' ? 'border-yellow-300/60' : ''
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getCatEmoji(ing.category)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{ing.name}</h3>
            <StatusBadge status={status} />
          </div>
          <p className={`text-xs mt-0.5 ${lowStock ? 'text-tomato font-medium' : 'text-warm-gray'}`}>
            {ing.stock_qty}{min != null ? ` / ${min}` : ''} {ing.unit}
            {lowStock && ' · low'}
          </p>
          <p className="text-[11px] text-warm-gray mt-1">
            Last checked: {since == null ? 'Never' : since === 0 ? 'Today' : `${since} day${since === 1 ? '' : 's'} ago`}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center gap-2 flex-wrap">
        <label className="text-[11px] text-warm-gray">Remind every</label>
        <select
          value={interval}
          onChange={(e) => onChangeInterval(ing, parseInt(e.target.value, 10))}
          className="text-xs px-2 py-1 rounded border bg-white"
        >
          {REMINDER_OPTIONS.map(d => (
            <option key={d} value={d}>{d} days</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 mt-3">
        <button
          onClick={() => onMarkChecked(ing)}
          className="flex-1 py-1.5 rounded text-sm font-medium text-sage hover:bg-sage/10"
        >✅ Mark Checked</button>
        <button
          onClick={() => onBuy(ing)}
          className="flex-1 py-1.5 rounded text-sm font-medium text-terracotta hover:bg-terracotta/10"
        >🛒 Buy</button>
      </div>
    </div>
  );
}

export default function StaplesPage({ ingredients, onChangeInterval, onMarkChecked, onBuy }) {
  const staples = useMemo(() => ingredients.filter(i => i.is_staple), [ingredients]);

  const { needs, recent } = useMemo(() => {
    const needs = [], recent = [];
    for (const i of staples) {
      const s = reminderStatus(i);
      if (s === 'never' || s === 'overdue') needs.push(i);
      else recent.push(i);
    }
    // Most overdue first (largest daysSince), nevers float to top.
    needs.sort((a, b) => {
      const sa = daysSince(a.last_reminder_checked);
      const sb = daysSince(b.last_reminder_checked);
      if (sa == null && sb == null) return a.name.localeCompare(b.name);
      if (sa == null) return -1;
      if (sb == null) return 1;
      return sb - sa;
    });
    // Most recently checked first.
    recent.sort((a, b) => {
      const sa = daysSince(a.last_reminder_checked) ?? 0;
      const sb = daysSince(b.last_reminder_checked) ?? 0;
      return sa - sb;
    });
    return { needs, recent };
  }, [staples]);

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center text-terracotta"><PkgIcon /></div>
            <div>
              <h1 className="font-semibold text-xl">📦 Staples</h1>
              <p className="text-sm text-warm-gray">{staples.length} tracked · {needs.length} need attention</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {staples.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">📦</span>
            <p className="text-base font-bold text-charcoal mt-4">No staples yet</p>
            <p className="text-sm text-warm-gray mt-1">Mark ingredients as <code className="px-1 bg-light-gray/30 rounded">is_staple</code> to track restocks here.</p>
          </div>
        )}

        {needs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-charcoal flex items-center gap-2 mb-3">
              <span className="text-base">🔴</span> Needs Attention
              <span className="text-[11px] text-warm-gray font-normal">({needs.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {needs.map(i => (
                <StapleCard
                  key={i.id}
                  ing={i}
                  onChangeInterval={onChangeInterval}
                  onMarkChecked={onMarkChecked}
                  onBuy={onBuy}
                />
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-charcoal flex items-center gap-2 mb-3">
              <span className="text-base">🟢</span> Recently Checked
              <span className="text-[11px] text-warm-gray font-normal">({recent.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map(i => (
                <StapleCard
                  key={i.id}
                  ing={i}
                  onChangeInterval={onChangeInterval}
                  onMarkChecked={onMarkChecked}
                  onBuy={onBuy}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
