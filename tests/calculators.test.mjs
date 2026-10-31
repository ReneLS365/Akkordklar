import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CALCULATORS,GROUPS,defaults,runCalculator} from '../dist/calculators.mjs';
const run=(id,changes={})=>runCalculator(id,{...defaults(CALCULATORS.find(c=>c.id===id)),...changes});

test('Latest masterprompt restores wage modules, without separate net/plast modules',()=>{
  assert.equal(GROUPS.some(g=>['net','wages'].includes(g.id)),false);
  assert.equal(CALCULATORS.some(c=>['reuse','horizontalnet'].includes(c.id)),false);
  for(const id of ['education','mentor','introSplit','tightCover'])assert.ok(CALCULATORS.some(c=>c.id===id));
});
test('H: actual installation height boundaries; no silent rounding above 52',()=>{
  for(const [height,percent] of [[17.99,0],[18,30],[26,30],[26.01,70],[32,70],[32.01,100],[42,100],[42.01,160],[52,160],[55,180],[58,200]])assert.equal(run('height',{height}).percent,percent,`${height} m`);
  assert.equal(run('height',{height:53}).valid,false);
  assert.equal(run('height',{height:53,confirmedSteps:1}).percent,180);
  assert.equal(run('height',{height:53,noHeight:true}).percent,0);
  assert.equal(run('height',{height:53,paidHoisting:true}).percent,0);
  assert.equal(run('height',{kind:'tent',eaves:20,ridge:24,crane:true}).percent,15);
  assert.equal(run('height',{kind:'part',crane:true}).valid,false);
});
test('Roof: strictly over 15 degrees, eligible base only',()=>{
  assert.equal(run('roof',{angle:15}).amount,0);
  assert.equal(run('roof',{angle:15.01}).amount,2000);
  assert.equal(run('roof',{angle:25,eligible:false}).valid,false);
});
test('Tent: <=20 / >20, mutually exclusive special rate and correct national basis',()=>{
  assert.equal(run('tent').valid,false);
  assert.equal(run('tent',{correctBase:true,angle:20}).percent,47);
  assert.equal(run('tent',{correctBase:true,angle:20.01}).percent,70);
  assert.equal(run('tent',{correctBase:true,angle:20,special:true}).percent,70);
  assert.equal(run('tent',{correctBase:true,kind:'screen',angle:30}).percent,47);
});
test('Other percentage extras: 7 and conditional 25, no after-move supplement',()=>{
  assert.equal(run('reload',{base:1000}).amount,70);
  assert.equal(run('after',{base:1000,kind:'hoist',approved:true,move:false}).amount,250);
  assert.equal(run('after',{base:1000,kind:'hoist',approved:true,move:true}).amount,0);
  assert.equal(run('after',{base:1000,kind:'chute',approved:true,move:true}).amount,250);
  assert.equal(run('after',{approved:false}).amount,0);
});
test('Km: free 20 per day not per journey; no negative result',()=>{
  assert.equal(run('travel',{km:20,people:3,days:1}).amount,0);
  assert.equal(run('travel',{km:15,people:3,days:1}).amount,0);
  assert.equal(run('travel',{km:46,people:2,days:3}).amount,340.08);
  assert.equal(run('travel',{people:1.5}).valid,false);
});
test('Work deck movements and assembly deck: correct G factors without invented T',()=>{
  assert.equal(run('move',{distance:2,main:1000,others:300}).amount,1450);
  assert.equal(run('move',{distance:2.01}).valid,false);
  assert.equal(run('assemblyDeck',{distance:2,base:1000,finalRemoval:false}).amount,1000);
  assert.equal(run('assemblyDeck',{distance:2.01,base:1000,finalRemoval:false}).amount,1500);
  assert.equal(run('assemblyDeck',{distance:2.01,base:1000,finalRemoval:true}).amount,2000);
});
test('Demounting / single rail factors and barriers exception',()=>{
  assert.equal(run('disassembly',{base:1000}).amount,500);
  assert.equal(run('disassembly',{base:1000,barrier:true}).amount,1000);
  assert.equal(run('disassembly',{base:1000,single:true}).amount,250);
  assert.equal(run('disassembly',{base:1000,single:true,barrier:true}).valid,false);
});
test('Unit rounding differs for m vs lbm; column lengths keep fractions',()=>{
  assert.equal(run('units',{quantity:12.4,rate:10,unit:'m'}).amount,120);
  assert.equal(run('units',{quantity:12.5,rate:10,unit:'m'}).amount,130);
  assert.equal(run('units',{quantity:2.01,rate:10,unit:'lbm'}).amount,30);
  assert.equal(run('units',{quantity:1.5,unit:'piece'}).valid,false);
  assert.equal(run('column',{one:8.58,length:.5,count:10}).amount,42.9);
});
test('Minimum is a test, not a top-up; special work needs an explicit agreement',()=>{
  assert.match(run('minimum',{base:492.55}).explanation,/Under grænsen/);
  assert.match(run('minimum',{base:492.56}).explanation,/Ikke under/);
  assert.equal(run('minimum').noAdd,true);
  assert.equal(run('agreement').valid,false);
  assert.equal(run('agreement',{confirmed:true,hours:1.25,people:3,rate:200,description:'Aftalt indbæring'}).amount,750);
  assert.equal(run('agreement',{confirmed:true,kind:'fixed',fixed:345.67,description:'Aftalt beløb'}).amount,345.67);
});
