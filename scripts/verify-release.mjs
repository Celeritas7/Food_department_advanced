// Run locally or in CI. No hosted SQL, credentials, deployments or git writes.
import {spawnSync} from 'node:child_process';
const commands=[
 ['Unit tests',['--experimental-vm-modules','node_modules/jest/bin/jest.js','--runInBand']],
 ...['scaling-ui','identity-ui','supplies-ui','fermentation-ui','pantry-db','fermentation-db','pages-build'].map(name=>[name,[`scripts/test-${name}.mjs`]]),
 ['Production build',['node_modules/vite/bin/vite.js','build']],
 ['Pages output',['scripts/check-pages-build.mjs']],
];
for(const [label,args] of commands){
 console.log(`\nRunning ${label}`);
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error || result.status!==0){console.error(`${label} failed`,result.error?.message || '');process.exit(result.status || 1);}
}
console.log('\nLocal release verification passed. Hosted migrations and signed-in/device acceptance must be checked separately.');
