import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
for(const dir of ['dist','scripts','tests'])for(const file of readdirSync(dir).filter(f=>f.endsWith('.mjs')||f.endsWith('.cjs'))){const result=spawnSync(process.execPath,['--check',`${dir}/${file}`],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'));
for(const icon of manifest.icons)if(!existsSync(`dist/${icon.src.replace('./','')}`))throw new Error(`Missing icon ${icon.src}`);
console.log('All JavaScript files parse; manifest and icons verified.');
