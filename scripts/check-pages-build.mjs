import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export function checkPagesBuild(directory,base='/Food_department_advanced/') {
 const root=resolve(directory), errors=[];
 const requireFile=(name,label)=>{
  const path=resolve(root,name);
  if(relative(root,path)==='..' || relative(root,path).startsWith('..'+sep) || path===root || !existsSync(path) || !statSync(path).isFile()) errors.push(`${label}: missing or invalid file ${name}`);
 };
 const index=resolve(root,'index.html');
 if(!existsSync(index))return ['Missing index.html'];
 const html=readFileSync(index,'utf8');
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)) {
  const url=match[1];if(/^(https?:)?\/\//.test(url))continue;
  if(!url.startsWith(base)){errors.push(`HTML asset must use Pages base ${base}: ${url}`);continue;}
  requireFile(url.slice(base.length).split(/[?#]/)[0],'HTML asset');
 }
 const manifestPath=resolve(root,'.vite/manifest.json');
 if(!existsSync(manifestPath))return [...errors,'Missing Vite build manifest'];
 let manifest;
 try{manifest=JSON.parse(readFileSync(manifestPath,'utf8'));}catch{return [...errors,'Invalid build manifest'];}
 if(!Object.values(manifest).some(e=>e.isEntry))errors.push('No application entry in build manifest');
 for(const [key,entry] of Object.entries(manifest)) {
  requireFile(entry.file,`Bundle ${key}`);
  if(entry.isEntry && !html.includes(base+entry.file))errors.push(`Application entry ${key} is not referenced by HTML`);
  for(const file of [...(entry.css || []),...(entry.assets || [])])requireFile(file,`Bundle asset ${key}`);
  for(const dependency of [...(entry.imports || []),...(entry.dynamicImports || [])])if(!manifest[dependency])errors.push(`Bundle ${key}: missing manifest dependency ${dependency}`);
 }
 return errors;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const errors=checkPagesBuild(process.argv[2] || 'docs');
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Pages build checks passed: base paths, HTML assets and complete Vite bundle graph.');
}
