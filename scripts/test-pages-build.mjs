import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {checkPagesBuild} from './check-pages-build.mjs';
const dir=mkdtempSync(join(tmpdir(),'food-pages-'));
try {
 mkdirSync(join(dir,'.vite'));mkdirSync(join(dir,'assets'));mkdirSync(join(dir,'icons'));
 const html='<link rel="icon" href="/Food_department_advanced/icons/icon.png"><script src="/Food_department_advanced/assets/main.js"></script>';
 writeFileSync(join(dir,'index.html'),html);writeFileSync(join(dir,'icons/icon.png'),'image');writeFileSync(join(dir,'assets/main.js'),'entry');
 const manifest={'index.html':{file:'assets/main.js',isEntry:true,dynamicImports:['lazy']},lazy:{file:'assets/lazy.js'}};
 const write=()=>writeFileSync(join(dir,'.vite/manifest.json'),JSON.stringify(manifest));
 write();assert.match(checkPagesBuild(dir).join(),/missing.*lazy.js/);
 writeFileSync(join(dir,'assets/lazy.js'),'lazy');assert.deepEqual(checkPagesBuild(dir),[]);
 writeFileSync(join(dir,'index.html'),html.replace('/Food_department_advanced/icons/','/icons/'));assert.match(checkPagesBuild(dir).join(),/Pages base/);
 writeFileSync(join(dir,'index.html'),html);manifest.lazy.file='../outside.js';write();assert.match(checkPagesBuild(dir).join(),/invalid file/);
 manifest.lazy.file='assets/lazy.js';manifest['index.html'].imports=['missing'];write();assert.match(checkPagesBuild(dir).join(),/missing manifest dependency/);
 manifest['index.html'].imports=[];write();writeFileSync(join(dir,'index.html'),'<p>No application</p>');assert.match(checkPagesBuild(dir).join(),/not referenced by HTML/);
 console.log('Pages checker regressions passed: missing chunks, incorrect base, traversal, missing dependencies and valid output.');
} finally{rmSync(dir,{recursive:true,force:true});}
