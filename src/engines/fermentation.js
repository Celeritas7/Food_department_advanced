export const STAGES = ['fermenting', 'refrigerated', 'closed', 'discarded'];
export const activeBatch = batch => ['fermenting','refrigerated'].includes(batch.stage);
export function localDateTime(value = new Date()) {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
}
export function timestamp(value, label, optional = false) {
  if (!value && optional) return null;
  const n = Date.parse(value);
  if (!Number.isFinite(n)) throw new Error(`Enter a valid ${label}.`);
  return new Date(n).toISOString();
}
const note = value => {
  const s = String(value || '').trim();
  if (s.length > 2000) throw new Error('Use at most 2,000 characters for notes.');
  return s;
};
function reading(value, label, min = -Infinity, max = Infinity) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`Enter a finite ${label}${label === 'pH' ? ' from 0 to 14' : ''}.`);
  return n;
}
export function startDraft(draft, now = Date.now()) {
  const name = String(draft.name || '').trim();
  if (!name || name.length > 120) throw new Error('Enter a batch name up to 120 characters.');
  const startedAt = timestamp(draft.startedAt, 'start time');
  if (Date.parse(startedAt) > now) throw new Error('Start time cannot be in the future.');
  return { ...draft, name, startedAt, note: note(draft.note), nextCheckAt: timestamp(draft.nextCheckAt, 'next-check time', true) };
}
export function entryDraft(draft, batch, now = Date.now()) {
  if (!activeBatch(batch)) throw new Error('This batch log is closed.');
  const observedAt = timestamp(draft.observedAt, 'observation time');
  if (Date.parse(observedAt) < Date.parse(batch.started_at) || Date.parse(observedAt) > now) throw new Error('Observation time must be between the batch start and now.');
  const ph = reading(draft.ph, 'pH', 0, 14), temperatureC = reading(draft.temperatureC, 'temperature');
  const text = note(draft.note), stage = draft.stage || null;
  if (stage && (!STAGES.includes(stage) || stage === batch.stage)) throw new Error('Choose a different stage.');
  if (stage && Date.parse(observedAt) < Date.parse(batch.stage_changed_at)) throw new Error('Stage changes must follow the last stage change.');
  if (ph == null && temperatureC == null && !text && !stage && !draft.setCheck) throw new Error('Add a reading, note, stage change, or next-check change.');
  const terminal = ['closed','discarded'].includes(stage);
  return { ...draft, observedAt, ph, temperatureC, note: text, stage, setCheck: terminal || !!draft.setCheck, nextCheckAt: !terminal && draft.setCheck ? timestamp(draft.nextCheckAt, 'next-check time', true) : null };
}
export function dueLabel(batch, now = Date.now()) {
  if (!activeBatch(batch) || !batch.next_check_at) return '';
  return Date.parse(batch.next_check_at) <= now ? 'Check overdue' : 'Check scheduled';
}
export function mergeRecord(state, result) {
  return { batches: [...state.batches.filter(b => b.id !== result.batch.id), result.batch].sort((a,b)=>b.started_at.localeCompare(a.started_at)),
    entries: [...state.entries.filter(e=>e.id !== result.entry.id),result.entry].sort((a,b)=>a.observed_at.localeCompare(b.observed_at) || a.id.localeCompare(b.id)) };
}
