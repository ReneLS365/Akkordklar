import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
test('Offline shell contains all application modules and existing static assets',()=>{const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');const files=[...sw.matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]);for(const file of files)if(file)assert.ok(existsSync(new URL(`../dist/${file}`,import.meta.url)),file);for(const file of readdirSync(new URL('../dist',import.meta.url)).filter(f=>f.endsWith('.mjs')))assert.ok(files.includes(file),`${file} absent from offline shell`);assert.match(sw,/request\.method!=='GET'/);assert.match(sw,/!response\.redirected/);});
