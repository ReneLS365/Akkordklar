import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groundRate,scaffoldRate,calculateTransport} from '../dist/engine.mjs';
import {quickPriceResult} from '../dist/transport-price.mjs';
import {priceSummary} from '../dist/transport-price-view.mjs';

test('A6: zero distance requires documented loading/unloading, not just a number',()=>{
 for(const method of ['manual','wheels']) {
  for(const options of [{},{indicative:true},{handlingConfirmed:'true'}]) {
   const r=groundRate(0,method,options);
   assert.equal(r.valid,false);assert.equal(r.percent,null);assert.equal(r.requiresClarification,true);
  }
  assert.equal(groundRate(0,method,{handlingConfirmed:true}).percent,7);
 }
 const route=calculateTransport({ground:0});
 const price=quickPriceResult({base:1000,transport:route});
 assert.equal(price.complete,false);assert.equal(price.amount,null);
 assert.match(priceSummary(price,false),/A6/);
 assert.equal(calculateTransport({ground:0,excluded:true}).percent,0);
 assert.equal(calculateTransport({ground:0,source:'direct',directScope:'tent'}).percent,0);
});

test('Task 01: complete manual/wheels and scaffold boundary matrix',()=>{
 for(const [d,p] of [[25,7],[25.01,14],[35,14],[35.01,21],[45,21],[55,28],[55.01,35],[75.01,42]]) {
  assert.equal(groundRate(d,'wheels').percent,p);
  const r=groundRate(d,'manual');
  assert.equal(r.percent,d>55?null:p);assert.equal(r.valid,d<=55);
 }
 for(const g of [25,25.01])for(const [s,short,long] of [[10,0,0],[10.01,0,7],[15,0,7],[15.01,7,7],[20,7,7],[20.01,7,14],[25,7,14]])
  assert.equal(scaffoldRate(g,s).percent,g===25?short:long,`${g}/${s}`);
 for(const [d,p] of [[150,7],[150.01,14],[200.01,21]])assert.equal(groundRate(d,'truck').percent,p);
});
