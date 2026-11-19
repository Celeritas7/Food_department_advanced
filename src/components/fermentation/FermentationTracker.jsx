import { useEffect, useRef, useState } from 'react';
import defaultApi from '../../services/fermentation.js';
import { activeBatch, dueLabel, localDateTime, mergeRecord, STAGES } from '../../engines/fermentation.js';
const fieldClass = 'w-full border rounded-lg px-3 py-2 bg-white text-base';
const buttonClass = 'rounded-lg bg-terracotta text-white px-4 py-2 disabled:opacity-50';
const date = value => value ? new Date(value).toLocaleString(undefined,{timeZoneName:'short'}) : 'Not scheduled';
function Field({label,children}) { return <label className="block text-sm space-y-1"><span>{label}</span>{children}</label>; }
const newStart = dish => ({id:crypto.randomUUID(), name:`${dish.name} batch`,startedAt:localDateTime(),containerId:'',containerLabel:'',nextCheckAt:'',note:''});
const newEntry = () => ({id:crypto.randomUUID(),observedAt:localDateTime(),ph:'',temperatureC:'',note:'',stage:'',setCheck:false,nextCheckAt:''});
function useDraft(make) {
  const [draft,setDraft] = useState(make);
  const change = (key,value) => setDraft(d=>({...d,[key]:value,id:crypto.randomUUID()}));
  return [draft,change,()=>setDraft(make())];
}
function StartForm({dish,onStart,onResult,disabled}) {
  const [draft,change,reset] = useDraft(()=>newStart(dish));
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const lock = useRef(false);
  const containers = dish.recipe_data?.supplies?.equipment?.filter(e=>e.type==='container') || [];
  const submit = async event => {
    event.preventDefault(); if(lock.current)return; lock.current=true; setBusy(true); setError('');
    try { onResult(await onStart(draft)); reset(); } catch(e) {setError(e.message);} finally {lock.current=false;setBusy(false);}
  };
  return <details className="border rounded-xl p-3"><summary className="cursor-pointer font-medium">Start a batch log</summary>
    <form onSubmit={submit} className="space-y-3 mt-3"><fieldset disabled={busy || disabled} className="space-y-3">
      <Field label="Batch name"><input required maxLength={120} className={fieldClass} value={draft.name} onChange={e=>change('name',e.target.value)} /></Field>
      <Field label="Started at (local time)"><input required type="datetime-local" className={fieldClass} value={draft.startedAt} onChange={e=>change('startedAt',e.target.value)} /></Field>
      <Field label="Container"><select className={fieldClass} value={draft.containerId} onChange={e=>change('containerId',e.target.value)}><option value="">Describe manually / unknown</option>{containers.map(e=><option key={e.id} value={e.id}>{e.name}{e.capacityMl ? ` · ${e.capacityMl} ml each` : ''}</option>)}</select></Field>
      {!draft.containerId && <Field label="Container description (optional)"><input maxLength={120} className={fieldClass} value={draft.containerLabel} onChange={e=>change('containerLabel',e.target.value)} /></Field>}
      <Field label="Next check (optional, local time)"><input type="datetime-local" className={fieldClass} value={draft.nextCheckAt} onChange={e=>change('nextCheckAt',e.target.value)} /></Field>
      <Field label="Starting notes"><textarea maxLength={2000} className={fieldClass} value={draft.note} onChange={e=>change('note',e.target.value)} /></Field>
      <p className="text-sm text-warm-gray">Starting a log does not deduct ingredients or mark the dish cooked. Record ingredient use through the existing Cook action.</p>
      <button className={buttonClass} type="submit">{busy ? 'Starting…' : 'Start batch log'}</button>
    </fieldset>{error && <p role="alert" className="text-tomato">{error}</p>}</form>
  </details>;
}
function BatchCard({batch,entries,api,onResult,now}) {
  const [draft,change,reset] = useDraft(newEntry);
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const lock = useRef(false);
  const submit = async event => {
    event.preventDefault(); if(lock.current)return; lock.current=true;setBusy(true);setError('');
    try {onResult(await api.append(batch,draft));reset();} catch(e){setError(e.message);} finally {lock.current=false;setBusy(false);}
  };
  const hours = Math.max(0,Math.floor((now-Date.parse(batch.started_at))/3600000));
  return <article className="border rounded-xl p-4 space-y-3 bg-white">
    <div><h3 className="font-semibold break-words">{batch.name}</h3><p className="text-sm">{batch.dish_name} · {batch.stage}</p><p className="text-sm text-warm-gray">Started {date(batch.started_at)} · {hours} hours since start</p></div>
    {activeBatch(batch) && <p className="text-sm"><strong>{dueLabel(batch,now)}</strong> · Next check: {date(batch.next_check_at)}</p>}
    <details><summary className="cursor-pointer text-sm">Starting recipe & container</summary><div className="text-sm mt-2 space-y-2">
      <p>Batch multiplier: ×{batch.recipe_snapshot?.batchScale ?? '?'} · Container: {batch.container_snapshot?.name || 'Unknown'}{batch.container_snapshot?.capacityMl ? ` · ${batch.container_snapshot.capacityMl} ml each` : ''}</p>
      <p>Planned amounts at start; these are not recorded stock deductions.</p>
      {[...(batch.recipe_snapshot?.ingredients || []),...(batch.recipe_snapshot?.preparations || [])].map((i,index)=><p key={index}>{i.name}: {i.plannedQuantity ?? 'Unspecified'} {i.unit}</p>)}
      <details><summary>Full saved recipe details</summary><pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(batch.recipe_snapshot?.recipeData,null,2)}</pre></details>
    </div></details>
    <details><summary className="cursor-pointer">History ({entries.length})</summary><ol className="space-y-3 mt-3">{entries.map(e=><li key={e.id} className="border-l-2 border-sage pl-3 text-sm"><p>{date(e.observed_at)}{e.stage ? ` · ${e.stage}` : ''}</p>{e.ph != null && <p>Reported pH: {e.ph}</p>}{e.temperature_c != null && <p>Reported temperature: {e.temperature_c} °C</p>}{e.note && <p className="whitespace-pre-wrap break-words">{e.note}</p>}{e.set_check && <p>Next check set: {date(e.next_check_at)}</p>}</li>)}</ol></details>
    {activeBatch(batch) ? <details><summary className="cursor-pointer font-medium">Record an observation or stage change</summary><form onSubmit={submit} className="mt-3 space-y-3"><fieldset disabled={busy} className="space-y-3">
      <Field label="Observed at (local time)"><input type="datetime-local" required className={fieldClass} value={draft.observedAt} onChange={e=>change('observedAt',e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="pH (optional)"><input type="number" min="0" max="14" step="any" className={fieldClass} value={draft.ph} onChange={e=>change('ph',e.target.value)} /></Field><Field label="Temperature °C (optional)"><input type="number" step="any" className={fieldClass} value={draft.temperatureC} onChange={e=>change('temperatureC',e.target.value)} /></Field></div>
      <Field label="Notes / correction to an earlier entry"><textarea maxLength={2000} className={fieldClass} value={draft.note} onChange={e=>change('note',e.target.value)} /></Field>
      <Field label="Stage change"><select className={fieldClass} value={draft.stage} onChange={e=>change('stage',e.target.value)}><option value="">Keep current stage</option>{STAGES.filter(s=>s!==batch.stage).map(s=><option key={s} value={s}>{s === 'closed' ? 'Close log' : s === 'discarded' ? 'Record discarded' : s}</option>)}</select></Field>
      {['closed','discarded'].includes(draft.stage) ? <p className="text-sm">This closes the log and clears the next check. It cannot be reopened.</p> : <><label className="flex gap-2 text-sm"><input type="checkbox" checked={draft.setCheck} onChange={e=>change('setCheck',e.target.checked)} />Change next check</label>{draft.setCheck && <Field label="Next check (leave blank to clear)"><input type="datetime-local" className={fieldClass} value={draft.nextCheckAt} onChange={e=>change('nextCheckAt',e.target.value)} /></Field>}</>}
      <button className={buttonClass} type="submit">{busy ? 'Saving…' : 'Save observation'}</button>
    </fieldset>{error && <p role="alert" className="text-tomato">{error}</p>}</form></details> : <p className="text-sm text-warm-gray">Log closed. History is preserved.</p>}
  </article>;
}
export default function FermentationTracker({dish,api=defaultApi,onStart,disabled=false,initiallyOpen=false}) {
  const [open,setOpen] = useState(initiallyOpen), [state,setState] = useState(null), [error,setError] = useState(''),[loading,setLoading] = useState(false),[filter,setFilter] = useState('active'),[now,setNow] = useState(Date.now);
  const alive = useRef(true), loadingLock = useRef(false), revision = useRef(0);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const load = async () => {
    if(loadingLock.current)return; loadingLock.current=true;setLoading(true);setError(''); const version = revision.current;
    try {const result=await api.list(dish?.id);if(alive.current && version === revision.current)setState(result);} catch(e){if(alive.current)setError(e.message);} finally {loadingLock.current=false;if(alive.current)setLoading(false);}
  };
  useEffect(()=>{if(open && !state && !loadingLock.current)load();},[open]);
  useEffect(()=>{if(!open)return;const id=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(id);},[open]);
  const result = value => {revision.current++;if(alive.current)setState(s=>mergeRecord(s || {batches:[],entries:[]},value));};
  return <section className="bg-white border rounded-xl p-4 space-y-3">
    <button type="button" className="font-semibold text-left w-full" aria-expanded={open} onClick={()=>setOpen(!open)}>🫙 Fermentation batches {open ? '▾' : '▸'}</button>
    {open && <><p className="text-sm text-warm-gray">Keep observations and next-check dates. No automatic safety or readiness rating is calculated. Checks appear here; notifications are not sent.</p>
      {loading && <p role="status">Loading batch logs…</p>}{error && <div role="alert"><p className="text-tomato">{error}</p><button type="button" onClick={load} className={buttonClass}>Retry loading logs</button></div>}
      {state && <>{dish && <StartForm dish={dish} onStart={onStart || (draft=>api.start(dish.id,draft))} onResult={result} disabled={disabled || loading} />}
      <div className="flex flex-wrap gap-3 items-center"><Field label="Show batches"><select className={fieldClass} value={filter} onChange={e=>setFilter(e.target.value)}><option value="active">Active</option><option value="archived">Closed / discarded</option><option value="all">All</option></select></Field><button type="button" disabled={loading} onClick={load} className="text-sm underline">Refresh logs</button></div>
      {!state.batches.some(b=>filter==='all' || activeBatch(b)===(filter==='active')) && <p className="text-sm text-warm-gray">No batches in this view.{!dish ? ' Start one from a recipe.' : ''}</p>}
      {state.batches.filter(b=>filter==='all' || activeBatch(b)===(filter==='active')).map(b=><BatchCard key={b.id} batch={b} entries={state.entries.filter(e=>e.batch_id===b.id)} api={api} onResult={result} now={now} />)}</>}
    </>}
  </section>;
}
