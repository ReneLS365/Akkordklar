import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateTransport,houseZones} from '../dist/engine.mjs';
import {quickPriceResult,housePriceResult} from '../dist/transport-price.mjs';

const invalid=['','   ',null,undefined,false,-1,NaN,Infinity,'forkert',0.001];
const house={length:20,depth:12,entry:10,ground:8,method:'wheels',route:'both',stage:'ground'};

test('Inactive scaffold inputs never affect ground transport, pricing or the supplied draft',()=>{
 for(const method of ['manual','wheels','truck'])for(const scaffold of [...invalid,20,150]){
  const config=Object.freeze({ground:25,stage:'ground',method,scaffold});
  const route=calculateTransport(config);
  assert.deepEqual(route,calculateTransport({ground:25,stage:'ground',method,scaffold:0}));
  assert.equal(route.scaffold,0);assert.equal(route.scaffoldPercent,0);
  assert.equal(Object.is(config.scaffold,scaffold),true);
  for(const operation of ['montage','demontage']){
   const price=quickPriceResult({base:1000,operation,transport:route});
   assert.equal(price.complete,true);assert.equal(price.amount,70);
   assert.equal(price.workWithTransport,operation==='montage'?1070:570);
  }
 }
 assert.equal(calculateTransport({ground:25,scaffold:''}).percent,7);
});

test('Every missing or invalid active scaffold distance is rejected',()=>{
 for(const scaffold of invalid)assert.throws(()=>calculateTransport({ground:25,stage:'scaffold',scaffold}),/Afstand på stilladset/);
});

test('Stage changes preserve a valid distance and only add its active HP3 allowance',()=>{
 const draft={ground:25,scaffold:'20',method:'manual'};
 for(const [stage,percent] of [['scaffold',14],['ground',7],['scaffold',14]]){
  const result=calculateTransport({...draft,stage});
  assert.equal(result.percent,percent);assert.equal(result.scaffold,stage==='scaffold'?20:0);
  assert.equal(draft.scaffold,'20');
 }
 for(const [ground,scaffold,percent] of [[25,0,7],[25,15,7],[25,15.01,14],[25.01,10,14],[25.01,10.01,21]])
  assert.equal(calculateTransport({ground,scaffold,stage:'scaffold'}).percent,percent);
});

test('Inactive scaffold overrides do not block ground zones or rewrite their saved distances',()=>{
 const baseline=houseZones(house),id=baseline.zones[0].id;
 for(const scaffold of invalid){
  const overrides={[id]:{ground:25,scaffold}};
  const actual=houseZones({...house,distanceOverrides:overrides});
  const expected=houseZones({...house,distanceOverrides:{[id]:{ground:25,scaffold:0}}});
  assert.deepEqual(actual.zones.map(z=>[z.id,z.percent,z.scaffold]),expected.zones.map(z=>[z.id,z.percent,z.scaffold]));
  assert.equal(Object.is(overrides[id].scaffold,scaffold),true);
 }
});

test('Active manual scaffold overrides still reject blank, negative and malformed distances',()=>{
 const config={...house,stage:'scaffold'},id=houseZones(config).zones[0].id;
 for(const scaffold of invalid.filter(v=>v!=null))
  assert.throws(()=>houseZones({...config,distanceOverrides:{[id]:{scaffold}}}),/Rettet afstand på stilladset/);
});

test('Distributed and precise ground pricing retain their results with an inactive scaffold field',()=>{
 const clean=houseZones(house).zones,dirty=houseZones({...house,scaffold:''}).zones;
 const modes=[{mode:'uniform',montage:1000},{mode:'precise',materials:[{itemId:'1a',quantity:10,zoneId:clean[0].id}]}];
 for(const pricing of modes){
  const expected=housePriceResult(clean,pricing);
  assert.equal(expected.complete,true);assert.deepEqual(housePriceResult(dirty,pricing),expected);
 }
});
