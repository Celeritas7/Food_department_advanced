import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {startDraft,entryDraft} from '../src/engines/fermentation.js';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const Tracker=(await server.ssrLoadModule('/src/components/fermentation/FermentationTracker.jsx')).default;
const Recipe=(await server.ssrLoadModule('/src/components/pages/RecipePage.jsx')).default;
const dish={id:'d',name:'Kimchi',status:'In Progress',recipe_data:{batchScale:1,overview:'Original',ingredientGroups:[],preparation:[],cookingSteps:[]}};
let tree,loads=0,failLoad=false,failStart=true,failEntry=true,saves=0;
const starts=[],observations=[];
const batch={id:'b',name:'Kimchi batch',dish_id:'d',dish_name:'Kimchi',stage:'fermenting',started_at:new Date(Date.now()-86400000).toISOString(),stage_changed_at:new Date(Date.now()-86400000).toISOString(),next_check_at:new Date(Date.now()-3600000).toISOString(),recipe_snapshot:{batchScale:1,recipeData:dish.recipe_data,ingredients:[]},container_snapshot:{name:'Test jar'}};
const entry={id:'start',batch_id:'b',observed_at:batch.started_at,note:'Start',stage:'fermenting'};
const api={
 list:async()=>{loads++;if(failLoad)throw new Error('offline list');return {batches:[],entries:[]};},
 start:async(id,draft)=>{starts.push({id,draft});startDraft(draft);if(failStart)throw new Error('offline start');return {batch,entry};},
 append:async(b,draft)=>{observations.push(draft);const value=entryDraft(draft,b);if(failEntry)throw new Error('offline observation');return {batch:{...b,stage:value.stage || b.stage,next_check_at:['closed','discarded'].includes(value.stage)?null:b.next_check_at},entry:{id:draft.id,batch_id:b.id,observed_at:value.observedAt,ph:value.ph,note:value.note,stage:value.stage}};},
};
const text=()=>JSON.stringify(tree.toJSON());
const button=name=>tree.root.findAllByType('button').find(n=>n.children.join('').trim()===name);
const click=async name=>{const n=button(name);assert(n,`Button ${name}`);await act(async()=>n.props.onClick());};
const field=label=>tree.root.findAllByType('label').find(n=>n.findAllByType('span').some(s=>s.children.join('')===label)).findAll(n=>['input','textarea','select'].includes(n.type))[0];
const change=(label,value)=>act(()=>field(label).props.onChange({target:{value}}));
const submit=async index=>act(async()=>tree.root.findAllByType('form')[index].props.onSubmit({preventDefault(){}}));
try {
 await act(async()=>{tree=TestRenderer.create(React.createElement(Tracker,{dish,api}));});
 assert.equal(loads,0);await click('🫙 Fermentation batches ▸');assert.equal(loads,1);
 change('Starting notes','Keep this draft');await submit(0);
 assert.match(text(),/offline start/);assert.equal(field('Starting notes').props.value,'Keep this draft');
 const startId=starts.at(-1).draft.id;failStart=false;await submit(0);
 assert.equal(starts.at(-1).draft.id,startId);assert.equal(tree.root.findAllByType('article').length,1);
 assert.match(text(),/Check overdue/);assert.match(text(),/No automatic safety or readiness/);
 change('pH (optional)','4.1');change('Notes / correction to an earlier entry','First measurement');await submit(1);
 assert.match(text(),/offline observation/);assert.equal(field('pH (optional)').props.value,'4.1');
 const eventId=observations.at(-1).id;failEntry=false;await submit(1);assert.equal(observations.at(-1).id,eventId);
 assert.match(text(),/Reported pH/);assert.equal(field('pH (optional)').props.value,'');
 change('Notes / correction to an earlier entry','Unsaved draft');failLoad=true;await click('Refresh logs');
 assert.match(text(),/offline list/);assert.equal(field('Notes / correction to an earlier entry').props.value,'Unsaved draft');
 failLoad=false;change('Stage change','closed');await submit(1);
 assert.equal(tree.root.findAllByType('article').length,0);
 change('Show batches','archived');assert.match(text(),/Log closed/);assert.equal(tree.root.findAllByType('form').length,1);
 act(()=>tree.unmount());
 // Recipe save precedes the start RPC; a failed save blocks it. Opening is lazy.
 const ordered=[];let saveFailure=true;
 await act(async()=>{tree=TestRenderer.create(React.createElement(Recipe,{dish,ingredients:[],dishIngs:[],onSave:async()=>{saves++;ordered.push('save');if(saveFailure)throw new Error('Save failed');},onBack(){},notify(){},fermentationApi:{...api,start:async(id,draft)=>{ordered.push('start');return api.start(id,draft);}}}));});
 const before=loads;assert.equal(ordered.length,0);await click('🫙 Fermentation batches ▸');assert.equal(loads,before+1);
 const beforeStarts=starts.length;await submit(0);assert.equal(starts.length,beforeStarts);assert.match(text(),/Save the recipe batch/);
 saveFailure=false;await submit(0);assert.deepEqual(ordered.slice(-2),['save','start']);assert(saves>=2);act(()=>tree.unmount());
 // Initial load failure never renders an empty-state start form.
 failLoad=true;await act(async()=>{tree=TestRenderer.create(React.createElement(Tracker,{dish,api,initiallyOpen:true}));});
 assert.match(text(),/offline list/);assert.equal(tree.root.findAllByType('form').length,0);
 console.log('Fermentation component checks passed: lazy loading, errors, retained drafts, stable retry IDs, due checks, readings, closed history and save-before-start.');
} finally {if(tree)act(()=>tree.unmount());await server.close();}
