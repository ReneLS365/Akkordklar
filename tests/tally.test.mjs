import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshTally,setQuantity,tallyResult,searchMaterials,validateTally} from '../dist/tally.mjs';
import {MATERIALS} from '../dist/rule-data.mjs';
import {tallyAuditMarkup,createTallyView,ledgerFormula} from '../dist/tally-view.mjs';
import {backupPayload,parseBackup} from '../dist/project-store.mjs';
const sheet=(op='montage')=>{const s=freshTally();setQuantity(s,'3e',op,20);s.areas[0].route.ground=25;return s;};
test('HP3 2026 selected paper discrepancies and new GTH rows',()=>{
 for(const [id,price] of [['3e',17.16],['3g',25.74],['4o',9.65],['17c',311.27],['10a',52.71],['1d',4.24],['1e',4.55],['3a',4.29],['3h',34.32],['4a',5.36],['4b',5.36],['4c',5.36],['4d',5.36],['4e',6.43],['4f',6.43],['4i',12.87],['4j',23.59],['4k',17.16],['4l',18.23],['4m',21.44],['4n',25.74],['13a',15.02],['13b',21.44],['13c',19.30],['13d',23.59],['13e',17.16],['13f',21.44],['13g',21.44]]){const m=MATERIALS.find(m=>m.id===id);assert.equal(m.rate,price,id);assert.ok(m.G&&m.T&&m.H,id);}
 assert.equal(new Set(MATERIALS.map(m=>m.id)).size,MATERIALS.length);assert.equal(MATERIALS.length,111);
});
test('Search supports synonym, point and Danish decimal size',()=>{for(const q of ['stolpe 2,00','3e','søJLe 2.00'])assert.ok(searchMaterials(q).some(m=>m.id==='3e'));});
test('Count changes never duplicate a row; operation bases stay separate',()=>{
 const s=sheet();setQuantity(s,'3e','montage',21);setQuantity(s,'3e','montage',20);setQuantity(s,'3e','demontage',20);
 const r=tallyResult(s);assert.equal(s.rows.length,2);assert.equal(r.results.montage.workBase,343.2);assert.equal(r.results.demontage.workBase,171.6);assert.equal(r.results.demontage.transportBase,343.2);assert.equal(r.lines[1].rawTransport,24.024);assert.equal(r.amount,562.84);
});
test('GH, G-only and non-G amounts never acquire T',()=>{
 const s=freshTally();for(const id of ['15a','16a','13i'])setQuantity(s,id,'montage',10);
 const r=tallyResult(s);assert.equal(r.complete,true);assert.equal(r.tBase,0);assert.equal(r.results.montage.amount,0);
});
test('Actual two-area quantities yield weighted money; missing and excess allocations block',()=>{
 const s=sheet();s.areas.push({id:'b',name:'Bagside',route:{method:'manual',ground:35}});
 s.rows[0].allocations={'area-1':12,b:8};const r=tallyResult(s);assert.equal(r.complete,true);assert.equal(r.results.montage.amount,33.63);
 for(const q of [7,9]){s.rows[0].allocations.b=q;assert.equal(tallyResult(s).complete,false);}
 s.rows.push(structuredClone(s.rows[0]));assert.throws(()=>validateTally(s),/Dobbelt/);
});
test('Splitting rounded units cannot manufacture quantities',()=>{const s=freshTally();setQuantity(s,'14b','montage',1);s.areas.push({id:'b',name:'B',route:{ground:25}});s.rows[0].allocations={'area-1':.5,b:.5};assert.match(tallyResult(s).reason,/afrunding/);});
test('Existing transport boundary rules flow through the tally',()=>{
 for(const [method,d,p] of [['manual',25,7],['manual',25.01,14],['manual',35.01,21],['manual',45.01,28],['wheels',55.01,35],['truck',150,7],['truck',150.01,14],['truck',200.01,21]]){const s=sheet();Object.assign(s.areas[0].route,{method,ground:d});assert.equal(tallyResult(s).lines[0].route.percent,p);}
 const s=sheet();s.areas[0].route.ground=55.01;assert.equal(tallyResult(s).status,'AFKLARING_KRÆVES');
 s.areas[0].route={ground:25,scaffold:15.01,stage:'scaffold',reload:true};assert.equal(tallyResult(s).lines[0].route.percent,21);
 s.areas[0].route={ground:10,special:true};assert.equal(tallyResult(s).complete,false);
 s.areas[0].route={ground:0,source:'direct',directScope:'tent'};assert.equal(tallyResult(s).results.montage.amount,0);
 s.areas[0].route.ground=5;assert.equal(tallyResult(s).complete,false);
});
test('Full audit and print markup contains source, raw amount, work/T bases and minimum',()=>{const r=tallyResult(sheet('demontage'));const html=tallyAuditMarkup(r);for(const pattern of [/343,20/,/171,60/,/24,02400000/,/3e/,/A13/,/A8/,/A14/,/afrunding/,/sources\/HP3/])assert.match(html,pattern);});
test('Backup round trip retains quantities, favorites, routes and old unrelated ledger',()=>{
 const s=sheet();s.favorites=['3e'];const state={transport:{sheet:s,config:{},manual:[]},calcs:{},ledger:[],jobName:'Test',jobNotes:'',sub:{},projects:[]};const restored=parseBackup(JSON.parse(JSON.stringify(backupPayload(state))));assert.deepEqual(restored.current.transport.sheet,s);assert.deepEqual(tallyResult(restored.current.transport.sheet),tallyResult(s));
 delete state.transport.sheet;assert.ok(parseBackup(backupPayload(state)));state.transport.sheet={...s,version:999};assert.throws(()=>parseBackup(backupPayload(state)),/akkordseddel/);
});
test('A35 cannot be implicitly confirmed through the count screen',()=>{const s=freshTally();setQuantity(s,'19h','montage',100);assert.equal(tallyResult(s).complete,false);s.rows[0].correctTentBasis=true;s.areas[0].route.ground=25;assert.equal(tallyResult(s).complete,true);});
test('Invalid draft prevents using stale approved input',()=>{const s=sheet();s.draftErrors={quantity:'Ugyldigt antal'};assert.equal(tallyResult(s).complete,false);});
test('A14 rounding clarification blocks a final tally without changing work or transport bases',()=>{
 const s=freshTally();setQuantity(s,'1b','demontage',7);setQuantity(s,'1c','demontage',528);s.areas[0].route.ground=25;
 const r=tallyResult(s),minimum=r.results.demontage.minimum;
 assert.equal(minimum.priceSum,492.555);assert.equal(minimum.requiresClarification,true);
 assert.equal(r.results.demontage.complete,true);assert.equal(r.workBase,492.56);assert.equal(r.tBase,985.11);
 assert.equal(r.complete,false);assert.equal(r.status,'AFKLARING_KRÆVES');assert.equal(r.amount,null);assert.ok(r.warnings.includes(minimum.reason));
 for(const q of [527,529]){setQuantity(s,'1c','demontage',q);assert.equal(tallyResult(s).complete,true);}
});
test('Saved full-catalog audit survives complete backup import and stays immutable',()=>{
 const s=freshTally();for(const op of ['montage','demontage'])for(const m of MATERIALS){setQuantity(s,m.id,op,100);s.rows.at(-1).correctTentBasis=true;}
 s.areas[0].route.ground=25;s.approved=true;
 const audit=tallyAuditMarkup(tallyResult(s));assert.ok(audit.length>100000);
 const state={transport:{sheet:s,config:{},manual:[]},calcs:{},ledger:[],jobName:'Test',jobNotes:'',sub:{},projects:[]};
 const previous=globalThis.document;globalThis.document={querySelector:selector=>selector==='[data-sheet-audit]'?{innerText:audit}:{}};
 try{
  const view=createTallyView({getState:()=>state,persist:()=>{},addLine:line=>state.ledger.push(line),toast:message=>assert.fail(message)});
  view.handleClick({target:{closest:()=>({closest:()=>true,dataset:{sheetSave:''},hasAttribute:key=>key==='data-sheet-save'})}});
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
 assert.equal(state.ledger.length,1);state.projects=[{id:'saved',name:'Saved',data:structuredClone({...state,projects:undefined})}];delete state.projects[0].data.projects;
 const restored=parseBackup(JSON.parse(JSON.stringify(backupPayload(state))));
 const saved=restored.current.ledger[0];assert.equal(ledgerFormula(saved),audit);assert.equal(ledgerFormula({formula:'Historisk linje'}),'Historisk linje');assert.ok(saved.auditText.every(part=>part.length<=50000));assert.deepEqual(restored.projects[0].data.ledger[0],saved);
 assert.equal(saved.inputs.tally.rows.length,222);setQuantity(s,'3e','montage',1);assert.equal(saved.inputs.tally.rows.find(r=>r.id==='3e:montage').quantity,100);
});
