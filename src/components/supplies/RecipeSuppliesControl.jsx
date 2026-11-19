import { useState } from 'react';
import { equipmentReadiness, validateSupplies } from '../../engines/supplies.js';
import { recipeScale, formatQuantity } from '../../engines/scaling.js';
import PurchaseNote from './PurchaseNote.jsx';

export default function RecipeSuppliesControl({ dish, links, ingredients, onSave, disabled = false }) {
  const supplies = dish.recipe_data?.supplies || {};
  const equipment = Array.isArray(supplies.equipment) ? supplies.equipment : [];
  const notes = Array.isArray(supplies.shoppingNotes) ? supplies.shoppingNotes : [];
  const readiness = equipmentReadiness(dish);
  const [mode, setMode] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scale = recipeScale(dish);
  const begin = (kind, item) => {
    setMode(kind); setError('');
    setDraft(item ? {...item,purchase:{...item.purchase}} : {id:crypto.randomUUID(),name:'',type:'tool',status:'check',quantity:1,ingredientId:'',purchase:{}});
  };
  const change = (key,value) => setDraft(prev=>({...prev,[key]:value,...(['type','quantity','capacityMl','baseFillMl','headspacePercent'].includes(key)?{fitConfirmedScale:null}:{})}));
  const field = (label,key,type='text',extra={}) => <label className="block text-sm">{label}<input aria-label={label} type={type} value={draft[key]??''} onChange={e=>change(key,e.target.value)} className="block w-full border rounded-lg p-2" {...extra}/></label>;
  const purchaseField = (label,key,type='text') => <label className="block text-sm">{label}<input aria-label={label} type={type} step={type==='number'?'any':undefined} value={draft.purchase?.[key]??''} onChange={e=>setDraft(prev=>({...prev,purchase:{...prev.purchase,[key]:e.target.value}}))} className="block w-full border rounded-lg p-2" /></label>;
  const persist = async value => {
    setBusy(true);setError('');
    try { await onSave(validateSupplies(value));setDraft(null);setMode(null); }
    catch(err){setError(err.message||'Supplies were not saved. Try again.');}
    finally{setBusy(false);}
  };
  const save = () => {
    const key=mode==='equipment'?'equipment':'shoppingNotes';
    const rows=mode==='equipment'?equipment:notes;
    const next=rows.some(r=>r.id===draft.id)?rows.map(r=>r.id===draft.id?draft:r):[...rows,draft];
    return persist({...supplies,[key]:next});
  };
  return <details className="bg-white border rounded-xl p-4 mb-3">
    <summary className="font-semibold cursor-pointer">🫙 Equipment & shopping notes</summary>
    <p className="text-xs text-warm-gray my-2">For this recipe: equipment ownership and counts are recorded separately from food stock. Container capacity stays fixed; the recorded fill volume follows your batch size.</p>
    <fieldset disabled={disabled||busy} className="space-y-3 min-w-0">
      <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>begin('equipment')} className="border rounded-lg px-3 py-2 text-sm">+ Equipment</button><button type="button" onClick={()=>begin('note')} disabled={!links.length} className="border rounded-lg px-3 py-2 text-sm">+ Ingredient shopping note</button></div>
      {readiness.length===0 && <p className="text-sm text-warm-gray">No equipment recorded yet.</p>}
      {readiness.map((e,i)=><div key={`${e.id}:${i}`} className="border rounded-lg p-3 space-y-1">
        <p className="text-sm font-semibold">{e.name}{e.quantity?` × ${e.quantity}`:''} · {e.state==='ready'?'Ready':e.state==='need'?'Need':'Check'}</p>
        <p className="text-xs">{e.reason}</p>
        {e.capacityMl!=null&&<p className="text-xs">Capacity per item: {formatQuantity(e.capacityMl)} ml</p>}
        {e.requiredMl!=null&&<p className="text-xs">Selected batch: {formatQuantity(e.fillMl)} ml fill; minimum total capacity {formatQuantity(Math.ceil(e.requiredMl))} ml.</p>}
        {(e.material||e.compatibility||e.care)&&<p className="text-xs text-warm-gray">{[e.material,e.compatibility,e.care].filter(Boolean).join(' · ')}</p>}
        <PurchaseNote purchase={e.purchase} note={e.notes}/>
        <div className="flex gap-3 text-xs"><button type="button" onClick={()=>begin('equipment',equipment[i])}>Edit equipment {e.name}</button><button type="button" onClick={()=>persist({...supplies,equipment:equipment.filter((_,j)=>j!==i)})}>Remove equipment {e.name}</button></div>
      </div>)}
      {notes.map(n=><div key={n.id} className="border rounded-lg p-3 space-y-1"><p className="text-sm font-semibold">Shopping note: {n.name}</p><PurchaseNote purchase={n.purchase} note={n.note}/><div className="flex gap-3 text-xs"><button type="button" onClick={()=>begin('note',n)}>Edit shopping note {n.name}</button><button type="button" onClick={()=>persist({...supplies,shoppingNotes:notes.filter(r=>r.id!==n.id)})}>Remove shopping note {n.name}</button></div></div>)}
      {draft&&<div className="border-t pt-3 space-y-3">
        {mode==='equipment'?<>
          {field('Equipment name','name')}
          <div className="grid grid-cols-2 gap-2"><label className="text-sm">Type<select aria-label="Equipment type" value={draft.type} onChange={e=>change('type',e.target.value)} className="block w-full border rounded-lg p-2">{['container','pan','tool','appliance'].map(t=><option key={t}>{t}</option>)}</select></label><label className="text-sm">Availability<select aria-label="Equipment availability" value={draft.status} onChange={e=>change('status',e.target.value)} className="block w-full border rounded-lg p-2"><option value="check">Check</option><option value="have">Have for this recipe</option><option value="need">Need to get</option></select></label></div>
          {field('Equipment count','quantity','number',{min:1,max:100,step:1})}
          {draft.type==='container'&&<>
            {field('Capacity per item (ml)','capacityMl','number',{min:0,step:'any'})}
            {field('Original batch fill (ml)','baseFillMl','number',{min:0,step:'any'})}
            {field('Space to leave empty (%)','headspacePercent','number',{min:0,max:99.99,step:'any'})}
            <p className="text-xs text-warm-gray">Enter the total fill volume for the original 1× batch and your recipe's empty-space requirement. Weight is not converted to volume. Multiple containers are checked by combined volume.</p>
            <label className="block text-sm"><input aria-label="Confirm container fit" type="checkbox" checked={draft.fitConfirmedScale===scale&&scale!=null} onChange={e=>change('fitConfirmedScale',e.target.checked?scale:null)} /> I checked the fit for the selected {formatQuantity(scale)}× batch. Changing batch size requires a new check if measurements are missing.</label>
          </>}
          {field('Material','material')}{field('Heat source / compatibility','compatibility')}{field('Care instructions','care')}
          <label className="block text-sm">Equipment notes<textarea aria-label="Equipment notes" value={draft.notes||''} onChange={e=>change('notes',e.target.value)} className="w-full border rounded-lg p-2" rows={2}/></label>
        </>:<>
          <label className="block text-sm">Ingredient<select aria-label="Shopping note ingredient" value={draft.ingredientId} onChange={e=>{const i=ingredients.find(i=>i.id===e.target.value);setDraft(prev=>({...prev,ingredientId:e.target.value,name:i?.name||''}));}} className="block w-full border rounded-lg p-2"><option value="">Choose ingredient</option>{links.map(l=><option key={l.ingredient_id} value={l.ingredient_id}>{ingredients.find(i=>i.id===l.ingredient_id)?.name||'Unknown ingredient'}</option>)}</select></label>
          <label className="block text-sm">Shopping note<textarea aria-label="Shopping note" value={draft.note||''} onChange={e=>change('note',e.target.value)} className="w-full border rounded-lg p-2" rows={2}/></label>
        </>}
        <p className="text-sm font-medium">Optional purchase record</p>
        {purchaseField('Shop name','shop')}{purchaseField('Recorded price (yen)','priceYen','number')}{purchaseField('Pack size / price basis','packSize')}{purchaseField('Price checked on','checkedOn','date')}{purchaseField('Shop / product URL','url','url')}
        <p className="text-xs text-warm-gray">Prices are your recorded observations, not live quotations. Record pack size and date to make comparisons meaningful.</p>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={save} className="border rounded-lg px-3 py-2 text-sm">{mode==='equipment'?'Save equipment':'Save shopping note'}</button><button type="button" onClick={()=>{setDraft(null);setMode(null);setError('');}} className="border rounded-lg px-3 py-2 text-sm">Cancel supply edit</button></div>
      </div>}
    </fieldset>
    {busy&&<p role="status" className="text-sm">Saving supplies…</p>}
    {error&&<p role="alert" className="text-sm text-tomato">{error}</p>}
  </details>;
}
