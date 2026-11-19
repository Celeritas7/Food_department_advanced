import {jest} from '@jest/globals';
jest.unstable_mockModule('../../config/supabase.js',()=>({default:{}}));
const {createFermentationApi,fermentationError}=await import('../fermentation.js');
const now=new Date(Date.now()-60000).toISOString();
test('start and append send stable retry IDs and normalized optional values',async()=>{
 const calls=[];const api=createFermentationApi({rpc:async(name,args)=>{calls.push({name,args});return {data:{batch:{id:'b'},entry:{id:'e'}},error:null};}});
 await api.start('d',{id:'request',name:' Batch ',startedAt:now,containerLabel:'Jar'});
 expect(calls[0]).toMatchObject({name:'fd_start_fermentation_batch',args:{p_dish_id:'d',p_batch_id:'request',p_name:'Batch',p_container_id:null,p_next_check_at:null}});
 await api.append({id:'b',stage:'fermenting',started_at:now,stage_changed_at:now},{id:'observation',observedAt:now,ph:'0',stage:'closed',setCheck:true,nextCheckAt:'2027-01-01'});
 expect(calls[1]).toMatchObject({name:'fd_append_fermentation_entry',args:{p_entry_id:'observation',p_ph:0,p_temperature_c:null,p_stage:'closed',p_set_check:true,p_next_check_at:null}});
});
test('missing database support is distinguished from a network failure',async()=>{
 for(const code of ['42P01','PGRST205','PGRST202','42883']) expect(fermentationError({code}).message).toMatch(/migration/);
 expect(fermentationError({message:'offline'}).message).toBe('offline');
 const api=createFermentationApi({rpc:async()=>({error:{code:'PGRST202'}})});
 await expect(api.start('d',{id:'b',name:'B',startedAt:now})).rejects.toThrow(/migration/);
});
test('list reads stable pages and scopes entry queries to returned batches',async()=>{
 const calls=[];
 const client={from(table){let ids;const q={select(){return q;},eq(key,value){calls.push(['eq',key,value]);return q;},in(key,value){ids=value;calls.push(['in',key,value]);return q;},order(key){calls.push(['order',key]);return q;},async range(){return {data:table.endsWith('batches')?[{id:'b'}]:[{id:'e',batch_id:ids[0]}],count:1};}};return q;}};
 expect(await createFermentationApi(client).list('d')).toEqual({batches:[{id:'b'}],entries:[{id:'e',batch_id:'b'}]});
 expect(calls).toContainEqual(['eq','dish_id','d']);expect(calls).toContainEqual(['in','batch_id',['b']]);
 expect(calls.filter(c=>c[0]==='order' && c[1]==='id')).toHaveLength(2);
});
