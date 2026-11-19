import supabase from '../config/supabase.js';
import { fetchAllRows } from './paged.js';
import { startDraft, entryDraft } from '../engines/fermentation.js';
export function fermentationError(error) {
  if (['42P01','PGRST205','PGRST202','42883'].includes(error?.code)) return new Error('Fermentation tracking needs its database migration. Your draft is kept.');
  return new Error(error?.message || 'Fermentation request failed. Please retry.');
}
export function createFermentationApi(client = supabase) {
  const rpc = async (name,args) => {
    const {data,error} = await client.rpc(name,args);
    if (error) throw fermentationError(error);
    return data;
  };
  return {
    async list(dishId) {
      try {
        const batches = await fetchAllRows(opts => {
          let q = client.from('food_department_fermentation_batches').select('*',opts);
          if (dishId) q = q.eq('dish_id',dishId);
          return q.order('started_at',{ascending:false}).order('id');
        });
        const entries = [];
        for (let i=0; i<batches.length; i+=100) entries.push(...await fetchAllRows(opts => client.from('food_department_fermentation_entries').select('*',opts).in('batch_id',batches.slice(i,i+100).map(b=>b.id)).order('observed_at').order('id')));
        return {batches,entries};
      } catch (error) { throw fermentationError(error); }
    },
    start(dishId, draft) {
      const d = startDraft(draft);
      return rpc('fd_start_fermentation_batch',{p_dish_id:dishId,p_batch_id:d.id,p_name:d.name,p_started_at:d.startedAt,p_container_id:d.containerId || null,p_container_label:d.containerLabel || '',p_next_check_at:d.nextCheckAt,p_note:d.note});
    },
    append(batch,draft) {
      const d = entryDraft(draft,batch);
      return rpc('fd_append_fermentation_entry',{p_batch_id:batch.id,p_entry_id:d.id,p_observed_at:d.observedAt,p_ph:d.ph,p_temperature_c:d.temperatureC,p_note:d.note,p_stage:d.stage,p_next_check_at:d.nextCheckAt,p_set_check:!!d.setCheck});
    },
  };
}
export default createFermentationApi();
