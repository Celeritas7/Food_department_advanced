import {activeBatch,dueLabel,startDraft,entryDraft,mergeRecord,localDateTime} from '../fermentation.js';
const now=Date.parse('2026-11-19T10:00:00Z');
const batch={id:'b',stage:'fermenting',started_at:'2026-11-18T10:00:00Z',stage_changed_at:'2026-11-18T10:00:00Z',next_check_at:'2026-11-19T09:00:00Z'};
test('start validates names, dates and note limits, preserving optional checks',()=>{
 expect(startDraft({name:' Test ',startedAt:batch.started_at},now)).toMatchObject({name:'Test',nextCheckAt:null,note:''});
 for(const draft of [{name:'',startedAt:batch.started_at},{name:'A',startedAt:'bad'},{name:'A',startedAt:'2027-01-01'},{name:'A',startedAt:batch.started_at,note:'x'.repeat(2001)}]) expect(()=>startDraft(draft,now)).toThrow();
});
test('pH zero is valid, blank readings remain absent and readings must be finite',()=>{
 expect(entryDraft({observedAt:batch.started_at,ph:0},batch,now).ph).toBe(0);
 expect(entryDraft({observedAt:batch.started_at,note:'note',ph:'',temperatureC:''},batch,now)).toMatchObject({ph:null,temperatureC:null});
 for(const ph of [-1,15,NaN,Infinity]) expect(()=>entryDraft({observedAt:batch.started_at,ph},batch,now)).toThrow();
 expect(()=>entryDraft({observedAt:batch.started_at,temperatureC:Infinity},batch,now)).toThrow();
});
test('observations enforce chronology and closed logs; stage changes cannot predate the latest stage',()=>{
 for(const observedAt of ['2000-01-01','2027-01-01','bad']) expect(()=>entryDraft({observedAt,note:'x'},batch,now)).toThrow();
 expect(()=>entryDraft({observedAt:batch.started_at,note:'x'}, {...batch,stage:'closed'},now)).toThrow(/closed/);
 expect(()=>entryDraft({observedAt:batch.started_at,stage:'safe'},batch,now)).toThrow();
 expect(()=>entryDraft({observedAt:batch.started_at,stage:'fermenting'},batch,now)).toThrow();
 expect(()=>entryDraft({observedAt:batch.started_at,stage:'closed'},{...batch,stage_changed_at:'2026-11-19T09:00:00Z'},now)).toThrow(/follow/);
});
test('empty observations are rejected; explicit schedule clearing is allowed',()=>{
 expect(()=>entryDraft({observedAt:batch.started_at},batch,now)).toThrow(/Add/);
 expect(entryDraft({observedAt:batch.started_at,setCheck:true},batch,now)).toMatchObject({nextCheckAt:null,setCheck:true});
});
test('checks mark only active due logs, without safety or readiness inference',()=>{
 expect(dueLabel(batch,now)).toBe('Check overdue');
 expect(dueLabel({...batch,next_check_at:'2027-01-01'},now)).toBe('Check scheduled');
 expect(dueLabel({...batch,stage:'discarded'},now)).toBe('');
 expect(activeBatch({...batch,stage:'refrigerated'})).toBe(true);
});
test('merging a retried response never duplicates a batch or entry',()=>{
 const result={batch,entry:{id:'e',batch_id:'b',observed_at:batch.started_at}};
 let state=mergeRecord({batches:[],entries:[]},result);state=mergeRecord(state,result);
 expect(state.batches).toHaveLength(1);expect(state.entries).toHaveLength(1);
});
test('local form time round trips to the original minute',()=>{
 expect(Date.parse(localDateTime(now))).toBe(now);
});
