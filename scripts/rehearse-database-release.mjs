// Reconstruct an app-scoped catalog/data snapshot in an isolated PGlite DB.
// This is not an auth/Storage/project backup and never connects to a hosted DB.
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const path=process.argv[2];if(!path)throw new Error('Pass the Food Department snapshot JSON path.');
const bytes=readFileSync(path), backup=JSON.parse(bytes);
const db=new PGlite();
const ident=value=>'"'+String(value).replaceAll('"','""')+'"';
const table=name=>'public.'+ident(name);
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
 const owners=new Set(Object.values(backup.data).flat().map(r=>r.user_id).filter(Boolean));
 for(const id of owners)await db.query('INSERT INTO auth.users VALUES($1)',[id]);
 for(const t of backup.tables){
  assert(t.columns.every(c=>!c.identity && !c.generated),'Review generated/identity columns before restore');
  const cols=t.columns.map(c=>`${ident(c.name)} ${c.type}${c.default?' DEFAULT '+c.default:''}${c.notNull?' NOT NULL':''}`);
  await db.exec(`CREATE TABLE ${table(t.name)} (${cols.join(',')});`);
 }
 for(const f of backup.functions)await db.exec(f.definition);
 for(const t of backup.tables){
  if(backup.data[t.name].length)await db.query(`INSERT INTO ${table(t.name)} SELECT * FROM jsonb_populate_recordset(NULL::${table(t.name)},$1)`,[JSON.stringify(backup.data[t.name])]);
 }
 for(const foreign of [false,true])for(const t of backup.tables)for(const c of t.constraints){
  if((c.type==='f')===foreign)await db.exec(`ALTER TABLE ${table(t.name)} ADD CONSTRAINT ${ident(c.name)} ${c.definition}`);
 }
 for(const t of backup.tables){
  for(const index of t.indexes)await db.exec(index.replace(/CREATE (UNIQUE )?INDEX /,'CREATE $1INDEX IF NOT EXISTS '));
  for(const trigger of t.triggers)await db.exec(trigger);
  if(t.rls)await db.exec(`ALTER TABLE ${table(t.name)} ENABLE ROW LEVEL SECURITY`);
 }
 for(const v of backup.views)await db.exec(`CREATE VIEW ${table(v.name)}${v.options?.length?' WITH ('+v.options.join(',')+')':''} AS ${v.definition}`);
 for(const p of backup.policies || [])await db.exec(`CREATE POLICY ${ident(p.policyname)} ON ${table(p.tablename)} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(ident).join(',')}${p.qual?' USING ('+p.qual+')':''}${p.with_check?' WITH CHECK ('+p.with_check+')':''}`);
 for(const g of backup.grants || [])if(g.grantee!=='postgres')await db.exec(`GRANT ${g.privilege_type} ON ${table(g.table_name)} TO ${g.grantee==='PUBLIC'?'PUBLIC':ident(g.grantee)}`);
 // Restore exact function ACL entries; default PUBLIC execute is explicitly reset.
 for(const f of backup.functions){
  if(!f.acl)continue;
  await db.exec(`REVOKE ALL ON FUNCTION public.${f.signature} FROM PUBLIC,anon,authenticated,service_role`);
  for(const acl of f.acl){const match=acl.match(/^(.*?)=([X*]+)\//);if(!match)throw new Error('Review function ACL');const role=match[1].replace(/^"|"$/g,'');if(role && role!=='postgres')await db.exec(`GRANT EXECUTE ON FUNCTION public.${f.signature} TO ${ident(role)}`);else if(!role)await db.exec(`GRANT EXECUTE ON FUNCTION public.${f.signature} TO PUBLIC`);}
 }
 const restored={};
 for(const t of backup.tables){
  const rows=(await db.query(`SELECT * FROM ${table(t.name)} ORDER BY id`)).rows;
  // PGlite returns numeric strings; compare JSON in PostgreSQL instead of JS coercion.
  const actual=(await db.query(`SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.id),'[]') = $1::jsonb AS equal FROM ${table(t.name)} r`,[JSON.stringify(backup.data[t.name])])).rows[0].equal;
  assert(actual,`${t.name}: restored rows differ`);restored[t.name]=rows.length;
 }
 const databaseFingerprints=[];
 for(const t of backup.tables){
  const omit=t.name==='food_department_ingredients'?" - 'in_stock' - 'stock_status' - 'unit_conversions' - 'aliases'":t.name==='food_department_intermediate_ingredients'?" - 'recipe_unit'":'';
  databaseFingerprints.push((await db.query(`SELECT '${t.name}' AS table_name,count(*)::integer AS row_count,md5(coalesce(jsonb_agg(to_jsonb(t)${omit} ORDER BY id),'[]')::text) AS fingerprint FROM ${table(t.name)} t`)).rows[0]);
 }
 const presenceCorrections=[];
 const files=readdirSync(new URL('../supabase/migrations',import.meta.url)).sort();
 for(const suffix of ['accurate_pantry_calculations.sql','recipe_batch_scaling.sql','ingredient_aliases_substitutions.sql','fermentation_batches.sql']){
  const filename=files.find(f=>f.endsWith(suffix));assert(filename);await db.exec(read('supabase/migrations/'+filename));
 }
 const audit=(await db.query(read('scripts/release-audit.sql'))).rows;
 assert.deepEqual(audit.filter(r=>!r.passed),[]);
 for(const t of backup.tables){
  const rows=(await db.query(`SELECT to_jsonb(r) AS row FROM ${table(t.name)} r ORDER BY id`)).rows.map(r=>r.row);
  assert.equal(rows.length,backup.data[t.name].length,`${t.name}: row count changed`);
  for(let i=0;i<rows.length;i++){
   const original=backup.data[t.name][i];const expected={...original};
   if(t.name==='food_department_ingredients'){
    expected.in_stock=original.stock_qty==null?false:Number(original.stock_qty)>0 || (Number(original.stock_qty)===0 && original.in_stock);
    if(expected.in_stock!==original.in_stock)presenceCorrections.push(original.id);
   }
   const projected=Object.fromEntries(Object.keys(original).map(k=>[k,rows[i][k]]));
   assert.deepEqual(projected,expected,`${t.name}: original values changed`);
   if(t.name==='food_department_ingredients'){
    assert.equal(rows[i].stock_status,original.stock_qty==null?'check':Number(original.stock_qty)===0 && original.in_stock?'have_unknown':'known');
    assert.deepEqual(rows[i].unit_conversions,[]);assert.deepEqual(rows[i].aliases,[]);
   }
  }
 }
 console.log(JSON.stringify({backupSha256:createHash('sha256').update(bytes).digest('hex'),restoredRows:restored,totalRows:Object.values(restored).reduce((a,b)=>a+b,0),auditChecksPassed:audit.length,originalDataPreservedExceptDerivedPresence:true,presenceFlagsReconciled:presenceCorrections.length,databaseFingerprints,scope:backup.scope,auth:'Only owner UUID stubs used for local FK validation; real auth credentials excluded.'},null,2));
} finally {await db.close();}
