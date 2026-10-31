import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groundRate,scaffoldRate,calculateTransport,houseZones,weightedResult,uniformEstimate,routeDistance,toCm} from '../dist/engine.mjs';

test('A6 ground boundary values including started intervals',()=>{
  for(const method of ['wheels'])for(const [m,pct] of [[25,7],[25.01,14],[35,14],[35.01,21],[45,21],[45.01,28],[55,28],[55.01,35],[75,35],[75.01,42],[95,42],[95.01,49]]) assert.equal(groundRate(m,method).percent,pct,`${m} m / ${method}`);
});
test('A7 truck: 150 then started 50 m',()=>{
  for(const [m,pct] of [[0,7],[150,7],[150.01,14],[200,14],[200.01,21],[250,21]]) assert.equal(groundRate(m,'truck').percent,pct);
});
test('A6 scaffold: 15 included if <=25, otherwise 10',()=>{
  for(const [g,s,pct] of [[25,15,0],[25,15.01,7],[25,25,7],[25,25.01,14],[25.01,10,0],[25.01,10.01,7],[35,20,7],[35,20.01,14]]) assert.equal(scaffoldRate(g,s).percent,pct,`${g}/${s}`);
});
test('Official figures C1-C4: correct additive totals',()=>{
  for(const [ground,scaffold,percent] of [[45,0,21],[45,10,21],[45,10.01,28],[35,10,14],[35,10.01,21],[25,15,7],[25,15.01,14]]) assert.equal(calculateTransport({ground,scaffold,stage:'scaffold'}).percent,percent);
});
test('No invented rate for A8; exclusions have zero transport',()=>{
  assert.equal(calculateTransport({ground:10,special:true}).valid,false);
  assert.equal(calculateTransport({ground:10,excluded:true}).percent,0);
});
test('Shortest available perimeter routes and exact start point',()=>{
  assert.equal(routeDistance({position:40,origin:10,perimeter:64,route:'both'}),30);
  assert.equal(routeDistance({position:60,origin:10,perimeter:64,route:'both'}),14);
  assert.equal(routeDistance({position:60,origin:10,perimeter:64,route:'cw'}),50);
  assert.equal(routeDistance({position:60,origin:10,perimeter:64,route:'ccw'}),14);
  assert.equal(routeDistance({position:10,origin:10,perimeter:64,route:'cw'}),0);
});
test('House zones cover exactly the full perimeter; every zone has one actual rate',()=>{
  for(const route of ['both','cw','ccw']) for(const stage of ['ground','scaffold']) {
    const c={length:20,depth:12,entry:10,ground:8,route,stage,method:'wheels'};
    const r=houseZones(c);
    assert.equal(r.zones.reduce((n,z)=>n+z.length,0),64);
    assert.equal(r.zones[0].start,0);assert.equal(r.zones.at(-1).end,64);
    for(const z of r.zones){
      for(const factor of [0.01,0.25,0.5,0.75,0.99]){
        const position=z.start+(z.end-z.start)*factor;
        const p=2*(c.length+c.depth);
        const cw=((position-c.entry)%p+p)%p,ccw=p-cw;
        const delta=route==='cw'?cw:route==='ccw'?ccw:Math.min(cw,ccw);
        const ground=stage==='ground'?c.ground+delta:c.ground;
        // Independent formula, centimetre-free inside each open interval.
        const gp=7*(1+Math.max(0,Math.ceil((Math.min(ground,55)-25)/10))+Math.max(0,Math.ceil((ground-55)/20)));
        const sp=stage==='scaffold'?7*Math.max(0,Math.ceil((delta-(ground<=25?15:10))/10)):0;
        assert.equal(z.percent,gp+sp,JSON.stringify({route,stage,z,position}));
      }
    }
  }
});
test('Both routes lower the estimate; manual past 55 requires explicit preview',()=>{
  const c={length:20,depth:12,entry:10,ground:8,stage:'ground',method:'wheels'};
  const both=houseZones({...c,route:'both'}),cw=houseZones({...c,route:'cw'});
  assert.ok(uniformEstimate(both.zones)<uniformEstimate(cw.zones));
  assert.equal(houseZones({...c,route:'cw',method:'manual'}).valid,false);
  assert.equal(houseZones({...c,route:'cw',method:'manual',indicative:true}).valid,true);
  assert.equal(uniformEstimate(houseZones({...c,route:'cw',method:'manual',indicative:true}).zones),uniformEstimate(cw.zones));
});
test('Money: price-weighted percentages and missing amounts; zero is explicit',()=>{
  const r=weightedResult([{valid:true,percent:7,base:1000},{valid:true,percent:28,base:3000}]);
  assert.equal(r.percent,22.75);assert.equal(r.amount,910);assert.equal(r.base,4000);
  assert.equal(weightedResult([{valid:true,percent:7,base:''}]).complete,false);
  assert.equal(weightedResult([{valid:true,percent:7,base:1000},{valid:false,percent:null,base:1}]).complete,false);
  assert.equal(weightedResult([{valid:true,percent:7,base:1000},{valid:false,percent:null,base:0}]).complete,true);
  assert.equal(weightedResult([{valid:true,percent:7,base:10.11}]).amount,0.71);
  assert.equal(weightedResult([{valid:true,percent:7,base:0}]).complete,false);
});
test('Reject missing, negative, nonfinite and excess precision distances',()=>{
  for(const value of ['',null,-1,NaN,Infinity,'abc',25.001]) assert.throws(()=>toCm(value));
  assert.equal(toCm('25,01'),2501);
  assert.throws(()=>houseZones({length:20,depth:12,entry:21,ground:8,route:'both',stage:'ground',method:'manual'}));
});
