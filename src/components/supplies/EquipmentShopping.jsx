import { useState } from 'react';
import { equipmentShoppingRows } from '../../engines/supplies.js';
import { formatQuantity } from '../../engines/scaling.js';
import PurchaseNote from './PurchaseNote.jsx';
export default function EquipmentShopping({ dishes, onOpenRecipe }) {
  const [showReady,setShowReady]=useState(false);
  const rows=equipmentShoppingRows(dishes);
  const visible=showReady?rows:rows.filter(e=>e.state!=='ready');
  return <section aria-label="Equipment shopping" className="space-y-3">
    <h2 className="font-semibold">🫙 Equipment for In Progress recipes</h2>
    <p className="text-xs text-warm-gray">Each recipe keeps its own checklist. Entries are not merged: two batches may need separate jars or pans. Food shopping quantities are unaffected.</p>
    <label className="text-sm"><input aria-label="Include ready equipment" type="checkbox" checked={showReady} onChange={e=>setShowReady(e.target.checked)}/> Include ready equipment</label>
    {!visible.length&&<p className="text-sm text-warm-gray">{rows.length?'All recorded equipment is ready.':'No equipment recorded for active recipes. Add it from a recipe.'}</p>}
    {visible.map((e,i)=><article key={`${e.dishId}:${e.id}:${i}`} className="bg-white border rounded-xl p-4 space-y-2">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-sm">{e.name}{e.quantity?` × ${e.quantity}`:''}</h3><span className="text-xs">{e.state==='need'?'Need to get':e.state==='ready'?'Ready':'Check'}</span></div>
      <p className="text-xs">{e.dishName} · {e.reason}</p>
      {e.requiredMl!=null&&<p className="text-xs">Minimum combined capacity for this batch: {formatQuantity(Math.ceil(e.requiredMl))} ml</p>}
      <PurchaseNote purchase={e.purchase} note={e.notes}/>
      <button type="button" onClick={()=>onOpenRecipe?.(dishes.find(d=>d.id===e.dishId))} className="border rounded-lg px-3 py-1.5 text-xs">Review equipment for {e.dishName}</button>
    </article>)}
  </section>;
}
