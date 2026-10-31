import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateTransport,houseZones,transportLegs,routePositions} from '../dist/engine.mjs';
import {zoneTrace,traceMarkup} from '../dist/transport-visual.mjs';

test('C2: own unloading crane is one leg in the same ground transport',()=>{
 const r=calculateTransport({crane:10,ground:25,scaffold:20,stage:'scaffold',source:'truck'});
 assert.equal(r.groundTotal,35);assert.equal(r.groundPercent,14);assert.equal(r.included,10);assert.equal(r.scaffoldPercent,7);assert.equal(r.percent,21);
 const html=traceMarkup(r);assert.match(html,/Hejs → montage/);assert.match(html,/Samlet <b>21 %/);
 assert.equal(calculateTransport({crane:10,ground:15}).percent,7);
 assert.equal(calculateTransport({crane:10,ground:15.01}).percent,14);
});
test('C2: 25 m boundary includes own crane for the scaffold threshold',()=>{
 const low=calculateTransport({crane:10,ground:15,scaffold:15,stage:'scaffold'});
 const high=calculateTransport({crane:10,ground:15.01,scaffold:15,stage:'scaffold'});
 assert.equal(low.percent,7);assert.equal(low.included,15);
 assert.equal(high.groundPercent,14);assert.equal(high.included,10);assert.equal(high.percent,21);
});
test('C5/C6: foreign haulier starts T-distance at the deposited material',()=>{
 const r=calculateTransport({crane:100,ground:15,scaffold:15,stage:'scaffold',source:'external'});
 assert.equal(r.crane,100);assert.equal(r.countedCrane,0);assert.equal(r.groundTotal,15);assert.equal(r.included,15);assert.equal(r.percent,7);
 assert.equal(transportLegs({crane:10,ground:25,source:'truck'}).groundTotal,35);
});
test('User screenshot: manual over 55 is flagged; explicit preview has full table',()=>{
 const c={length:25,depth:9.5,entry:20,ground:25,crane:0,route:'both',stage:'ground',method:'manual'};
 assert.equal(houseZones(c).valid,false);
 const r=houseZones({...c,indicative:true});assert.equal(r.perimeter,69);assert.equal(r.valid,true);assert.equal(r.provisional,true);
 assert.equal(Math.max(...r.zones.map(z=>z.percent)),35);
 assert.ok(r.zones.some(z=>z.groundMax>55&&z.percent===35));
});
test('Own crane splits house zones at combined distance, not hand-carried distance',()=>{
 const base={length:20,depth:12,entry:10,route:'both',stage:'ground',method:'manual'};
 const a=houseZones({...base,crane:10,ground:15}),b=houseZones({...base,crane:0,ground:25});
 assert.deepEqual(a.zones.map(z=>[z.start,z.end,z.percent]),b.zones.map(z=>[z.start,z.end,z.percent]));
 for(const zone of a.zones){const trace=zoneTrace({...base,crane:10,ground:15},zone);assert.equal(trace.groundTotal,25+zone.sampleRoute);assert.equal(trace.manualGround,15+zone.sampleRoute);}
});
test('House scaffold route: fixed crane + fixed carry + variable scaffold leg',()=>{
 const c={length:20,depth:12,entry:10,crane:10,ground:25,route:'both',stage:'scaffold',method:'manual'};
 const result=houseZones(c);assert.equal(result.groundTotal,35);assert.equal(result.included,10);
 for(const zone of result.zones){const t=zoneTrace(c,zone);assert.equal(t.groundTotal,35);assert.equal(t.scaffold,zone.sampleRoute);assert.equal(t.percent,zone.groundPercent+zone.scaffoldPercent);}
});
test('Ordered route positions turn at actual corners and choose the open route',()=>{
 const r=routePositions({length:20,depth:12,origin:10,position:48,route:'both'});
 assert.equal(r.direction,'ccw');assert.equal(r.distance,26);assert.deepEqual(r.positions,[10,0,52,48]);
 const cw=routePositions({length:20,depth:12,origin:10,position:48,route:'cw'});
 assert.equal(cw.distance,38);assert.deepEqual(cw.positions,[10,20,32,48]);
 // Diagram midpoints may have half-centimetre precision, without changing input precision.
 assert.ok(routePositions({length:20,depth:12,origin:10,position:48.005,route:'both'}).distance>0);
});
test('No silent crane length coercion or second startup fee',()=>{
 assert.throws(()=>transportLegs({ground:25,crane:-1}));
 assert.throws(()=>transportLegs({ground:25,crane:''}));
 assert.equal(calculateTransport({ground:10,crane:10}).percent,7);
 assert.equal(calculateTransport({ground:25,crane:0}).percent,7);
});
