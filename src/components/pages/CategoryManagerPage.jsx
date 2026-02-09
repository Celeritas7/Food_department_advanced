/**
 * CategoryManagerPage.jsx — Manage ingredient categories
 * Rename, merge, delete, and move items between categories
 */
import { useState, useMemo } from 'react';
import { BackIcon } from '../ui/Icons';
import { getCatEmoji } from '../../config/emoji.js';

const EMOJI_OPTIONS = [
  '🧂', '🍎', '🥬', '🌶️', '🍚', '🧁', '🍗', '🐟', '🧈', '🫙',
  '🫒', '🍜', '🥫', '🥜', '🌿', '🍄', '🫘', '🥚', '🌾', '🧊',
  '🥤', '📦', '🥕', '🍳', '🫕', '🥩', '🍞', '🧀', '🍯', '🥛',
  '🫚', '🧄', '🫑', '🍋', '🥥', '🌰', '🦐', '🍶',
];

// ─── Category Card ───
function CategoryCard({ cat, emoji, items, isExpanded, onToggle, onMerge, onRename, onDelete, onMoveItems, allCategories }) {
  const [panel, setPanel] = useState(null); // 'rename' | 'merge' | null
  const [newName, setNewName] = useState(cat);
  const [newEmoji, setNewEmoji] = useState(emoji);
  const [mergeTarget, setMergeTarget] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [moveTarget, setMoveTarget] = useState('');

  const otherCats = allCategories.filter(c => c !== cat);

  const toggleItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) setSelectedItems([]);
    else setSelectedItems(items.map(i => i.id));
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div onClick={onToggle} className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{cat}</div>
          <div className="text-xs text-warm-gray">{items.length} item{items.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setPanel(panel === 'rename' ? null : 'rename'); setNewName(cat); setNewEmoji(emoji); }}
            title="Rename"
            className={`px-2 py-1.5 rounded-lg text-xs border ${panel === 'rename' ? 'bg-terracotta text-white border-terracotta' : 'border-light-gray text-warm-gray hover:border-warm-gray'}`}
          >✏️</button>
          <button
            onClick={() => { setPanel(panel === 'merge' ? null : 'merge'); setMergeTarget(''); }}
            title="Merge"
            className={`px-2 py-1.5 rounded-lg text-xs border ${panel === 'merge' ? 'bg-terracotta text-white border-terracotta' : 'border-light-gray text-warm-gray hover:border-warm-gray'}`}
          >🔀</button>
          {items.length === 0 && (
            <button onClick={onDelete} title="Delete empty" className="px-2 py-1.5 rounded-lg text-xs border border-tomato/30 text-tomato hover:bg-tomato/5">🗑️</button>
          )}
        </div>
        <span className={`text-xs text-warm-gray transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {/* Rename Panel */}
      {panel === 'rename' && (
        <div className="px-4 pb-4 border-t pt-3" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-semibold text-warm-gray mb-2">Rename category</p>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
          />
          <p className="text-xs text-warm-gray mb-1.5">Emoji:</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {EMOJI_OPTIONS.slice(0, 24).map(em => (
              <button
                key={em}
                onClick={() => setNewEmoji(em)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border ${newEmoji === em ? 'border-terracotta bg-terracotta/10' : 'border-light-gray'}`}
              >{em}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { if (newName.trim()) { onRename(newName.trim(), newEmoji); setPanel(null); } }}
              disabled={!newName.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${newName.trim() ? 'bg-terracotta' : 'bg-light-gray'}`}
            >Save</button>
            <button onClick={() => setPanel(null)} className="px-4 py-2 rounded-lg text-sm border">Cancel</button>
          </div>
        </div>
      )}

      {/* Merge Panel */}
      {panel === 'merge' && (
        <div className="px-4 pb-4 border-t pt-3" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-semibold text-warm-gray mb-2">Merge all {items.length} items into:</p>
          <select
            value={mergeTarget}
            onChange={e => setMergeTarget(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm mb-3"
          >
            <option value="">— Select target —</option>
            {otherCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => { if (mergeTarget) { onMerge(mergeTarget); setPanel(null); } }}
              disabled={!mergeTarget}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${mergeTarget ? 'bg-tomato' : 'bg-light-gray'}`}
            >Merge & Delete "{cat}"</button>
            <button onClick={() => setPanel(null)} className="px-4 py-2 rounded-lg text-sm border">Cancel</button>
          </div>
        </div>
      )}

      {/* Expanded: Item List */}
      {isExpanded && (
        <div className="border-t px-4 py-3">
          {items.length === 0 ? (
            <p className="text-sm text-warm-gray text-center py-4">Empty — can be deleted</p>
          ) : (
            <>
              {/* Select all */}
              <div className="flex justify-between items-center mb-2">
                <button onClick={selectAll} className="text-xs text-terracotta font-medium">
                  {selectedItems.length === items.length ? 'Deselect all' : 'Select all'}
                </button>
                <span className="text-xs text-warm-gray">{selectedItems.length} selected</span>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {items.map(item => {
                  const isSel = selectedItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${isSel ? 'bg-terracotta/5 border border-terracotta/30' : 'bg-cream border border-transparent'}`}
                    >
                      <div className={`w-4.5 h-4.5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${isSel ? 'bg-terracotta border-terracotta' : 'bg-white border-warm-gray/40'}`}
                        style={{ width: 18, height: 18 }}>
                        {isSel && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                      <span className="text-sm text-charcoal">{item.name}</span>
                      {item.stock_qty !== undefined && (
                        <span className={`text-xs ml-auto ${item.stock_qty > 0 ? 'text-sage' : 'text-tomato'}`}>
                          {item.stock_qty} {item.unit}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Move selected */}
              {selectedItems.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-butter/30 border border-butter">
                  <p className="text-xs font-semibold text-charcoal mb-2">
                    Move {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} to:
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={moveTarget}
                      onChange={e => setMoveTarget(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm"
                    >
                      <option value="">— Category —</option>
                      {otherCats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        if (moveTarget) {
                          onMoveItems(selectedItems, moveTarget);
                          setSelectedItems([]);
                          setMoveTarget('');
                        }
                      }}
                      disabled={!moveTarget}
                      className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${moveTarget ? 'bg-terracotta' : 'bg-light-gray'}`}
                    >Move</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function CategoryManagerPage({ ingredients, onBulkRename, onMoveItems, onBack, notify }) {
  const [expandedCat, setExpandedCat] = useState(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');

  // Build categories from actual ingredient data
  const categories = useMemo(() => {
    const map = {};
    ingredients.forEach(i => {
      const c = i.category || 'Uncategorized';
      if (!map[c]) map[c] = [];
      map[c].push(i);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [ingredients]);

  const allCatNames = categories.map(([c]) => c);

  // Rename: update all items from oldCat to newName
  const handleRename = async (oldCat, newName, newEmoji) => {
    if (oldCat === newName) return;
    await onBulkRename(oldCat, newName);
    if (expandedCat === oldCat) setExpandedCat(newName);
    notify(`Renamed "${oldCat}" → "${newEmoji} ${newName}"`, 'success');
  };

  // Merge: move all items from source to target, source becomes empty
  const handleMerge = async (sourceCat, targetCat) => {
    await onBulkRename(sourceCat, targetCat);
    setExpandedCat(null);
    notify(`Merged "${sourceCat}" → "${targetCat}"`, 'success');
  };

  // Delete: only works on empty categories (no DB action needed - category just disappears)
  const handleDelete = (cat) => {
    const items = ingredients.filter(i => (i.category || 'Uncategorized') === cat);
    if (items.length > 0) {
      notify('Can only delete empty categories');
      return;
    }
    notify(`"${cat}" removed`, 'warn');
  };

  // Move specific items
  const handleMoveItems = async (itemIds, targetCat) => {
    await onMoveItems(itemIds, targetCat);
    notify(`Moved ${itemIds.length} items → "${targetCat}"`, 'success');
  };

  // Add new empty category (just a UI hint — real category appears when items are assigned)
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    if (allCatNames.includes(newCatName.trim())) {
      notify('Category already exists!');
      return;
    }
    // For now just close — user will move items into it
    notify(`Created "${newCatEmoji} ${newCatName.trim()}" — move items into it`, 'success');
    setNewCatName('');
    setNewCatEmoji('📦');
    setShowAddCat(false);
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg text-warm-gray hover:bg-light-gray/20"><BackIcon /></button>
          <div className="flex-1">
            <h1 className="font-semibold text-xl">🏷️ Categories</h1>
            <p className="text-sm text-warm-gray">{categories.length} categories · {ingredients.length} ingredients</p>
          </div>
          <button
            onClick={() => setShowAddCat(!showAddCat)}
            className="px-3 py-2 rounded-lg bg-terracotta text-white text-sm font-medium"
          >+ New</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* Add Category Panel */}
        {showAddCat && (
          <div className="bg-white rounded-xl border-2 border-terracotta p-4 mb-4">
            <p className="text-sm font-semibold mb-3">New Category</p>
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Category name..."
              className="w-full px-3 py-2 rounded-lg border text-sm mb-2"
            />
            <p className="text-xs text-warm-gray mb-1.5">Emoji:</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {EMOJI_OPTIONS.slice(0, 24).map(em => (
                <button
                  key={em}
                  onClick={() => setNewCatEmoji(em)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border ${newCatEmoji === em ? 'border-terracotta bg-terracotta/10' : 'border-light-gray'}`}
                >{em}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${newCatName.trim() ? 'bg-terracotta' : 'bg-light-gray'}`}
              >Create {newCatEmoji} {newCatName || '...'}</button>
              <button onClick={() => setShowAddCat(false)} className="px-4 py-2 rounded-lg text-sm border">Cancel</button>
            </div>
          </div>
        )}

        {/* Category List */}
        <div className="space-y-3">
          {categories.map(([cat, items]) => (
            <CategoryCard
              key={cat}
              cat={cat}
              emoji={getCatEmoji(cat)}
              items={items}
              isExpanded={expandedCat === cat}
              onToggle={() => setExpandedCat(expandedCat === cat ? null : cat)}
              onRename={(name, emoji) => handleRename(cat, name, emoji)}
              onMerge={(target) => handleMerge(cat, target)}
              onDelete={() => handleDelete(cat)}
              onMoveItems={handleMoveItems}
              allCategories={allCatNames}
            />
          ))}
        </div>

        {/* Help */}
        <div className="mt-6 bg-white rounded-xl border p-4">
          <p className="text-sm font-semibold mb-2">How to use</p>
          <div className="text-xs text-warm-gray space-y-1">
            <p>✏️ <b>Rename</b> — Change category name & emoji</p>
            <p>🔀 <b>Merge</b> — Move ALL items to another category & delete this one</p>
            <p>🗑️ <b>Delete</b> — Only for empty categories</p>
            <p>☑️ <b>Select + Move</b> — Expand, check individual items, move to another category</p>
          </div>
        </div>
      </main>
    </div>
  );
}
