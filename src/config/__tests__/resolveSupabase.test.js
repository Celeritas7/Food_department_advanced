import {resolveSupabaseConfig} from '../resolveSupabase.js';
const defaults={url:'https://project.supabase.co',key:'sb_publishable_publicExample'};
const jwt=payload=>'header.'+btoa(JSON.stringify(payload))+'.signature';
test('fresh builds use the public app settings without an env file',()=>{
 expect(resolveSupabaseConfig({},defaults)).toEqual(defaults);
 expect(resolveSupabaseConfig({VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''},defaults)).toEqual(defaults);
});
test('a complete explicit override remains supported',()=>{
 expect(resolveSupabaseConfig({VITE_SUPABASE_URL:'https://other.supabase.co',VITE_SUPABASE_ANON_KEY:'sb_publishable_other'},defaults).url).toBe('https://other.supabase.co');
});
test('partial overrides cannot combine another project with the default key',()=>{
 for(const env of [{VITE_SUPABASE_URL:'https://other.supabase.co'},{VITE_SUPABASE_ANON_KEY:'sb_publishable_other'}])expect(()=>resolveSupabaseConfig(env,defaults)).toThrow(/both/);
});
test('missing and placeholder configuration fails before publishing',()=>{
 expect(()=>resolveSupabaseConfig({},{})).toThrow();
 expect(()=>resolveSupabaseConfig({},{...defaults,url:'https://YOUR_PROJECT.supabase.co'})).toThrow(/real HTTPS/);
 expect(()=>resolveSupabaseConfig({},{...defaults,key:'YOUR_ANON_KEY'})).toThrow(/publishable/);
});
test('secret and service-role keys are rejected',()=>{
 for(const key of ['sb_secret_private',jwt({role:'service_role',ref:'project'})])expect(()=>resolveSupabaseConfig({},{...defaults,key})).toThrow();
});
test('legacy anon compatibility validates the project reference',()=>{
 const key=jwt({role:'anon',ref:'project'});expect(resolveSupabaseConfig({},{...defaults,key}).key).toBe(key);
 expect(()=>resolveSupabaseConfig({},{...defaults,key:jwt({role:'anon',ref:'other'})})).toThrow(/match/);
});
