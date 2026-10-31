import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groundRate,scaffoldRate,calculateTransport,houseZones,weightedResult,routeDistance} from '../dist/engine.mjs';

const base={length:20,depth:12,entry:10,ground:8,route:'both',stage:'ground',method:'wheels'};
const route=(s,o,p,dir)=>dir==='cw'?((s-o)%p+p)%p:((o-s)%p+p)%p;
function independentGround(distance,method) {
 return method==='truck'?7*(1+Math.max(0,Math.ceil((distance-150)/50))):7*(1+Math.max(0,Math.ceil((Math.min(distance,55)-25)/10))+Math.max(0,Math.ceil((distance-55)/20)));
}

test('A6 manual zero through 55 is unconditional; >55 default is not a claim',()=>{
 for(const [m,p] of [[0,7],[1,7],[25,7],[25.1,14],[35,14],[35.01,21],[45,21],[45.01,28],[55,28]])assert.equal(groundRate(m).percent,p,`${m} m`);
 for(const [m,p] of [[55.01,35],[75,35],[75.01,42],[95,42],[95.01,49]]) {
  const r=groundRate(m);assert.equal(r.valid,false);assert.equal(r.percent,null);assert.equal(r.previewPercent,p);assert.equal(r.requiresClarification,true);assert.match(r.reason,/A6/);
  const preview=groundRate(m,'manual',{indicative:true});assert.equal(preview.valid,true);assert.equal(preview.provisional,true);assert.equal(preview.percent,p);
  const wheels=groundRate(m,'wheels');assert.equal(wheels.valid,true);assert.equal(wheels.percent,p);assert.ok(!wheels.provisional);
 }
});
test('A6/A8 local total rate needs both confirmation and written note',()=>{
 const c={ground:65,scaffold:20,stage:'scaffold',method:'manual',agreedRate:40,reload:true};
 assert.equal(calculateTransport(c).valid,false);
 assert.equal(calculateTransport({...c,agreementConfirmed:true}).valid,false);
 const agreed=calculateTransport({...c,agreementConfirmed:true,agreementNote:'Sjak og virksomhed: 40 % samlet, inklusive omlæsning.'});
 assert.equal(agreed.valid,true);assert.equal(agreed.percent,40);assert.equal(agreed.agreed,true);assert.ok(!agreed.provisional);
 const special=calculateTransport({...c,ground:5,special:true,agreementConfirmed:true,agreementNote:'Særskilt total for kælderrute'});
 assert.equal(special.percent,40);
 assert.throws(()=>calculateTransport({...c,agreementConfirmed:true,agreementNote:'aftalt',agreedRate:NaN}));
});
test('Truck/teleskoplæsser A7: all threshold endpoints',()=>{
 for(const [m,p] of [[0,7],[1,7],[149.99,7],[150,7],[150.01,14],[200,14],[200.01,21],[250,21]])assert.equal(calculateTransport({ground:m,method:'truck'}).percent,p);
 assert.throws(()=>calculateTransport({ground:150,crane:10,method:'truck'}));
});
test('C1-C6 own unloading crane versus external placement: table fixtures',()=>{
 const figures=[
  {name:'C1',ground:10,crane:25,scaffold:10,source:'truck',expected:14,included:10},
  {name:'C2',ground:25,crane:10,scaffold:20,source:'truck',expected:21,included:10},
  {name:'C3',ground:35,crane:0,scaffold:20,source:'truck',expected:21,included:10},
  {name:'C4',ground:15,crane:10,scaffold:15,source:'truck',expected:7,included:15},
  {name:'C5',ground:35,crane:100,scaffold:20,source:'external',expected:21,included:10},
  {name:'C6',ground:25,crane:100,scaffold:15,source:'external',expected:7,included:15},
 ];
 for(const f of figures) {
  const r=calculateTransport({...f,stage:'scaffold'});
  assert.equal(r.percent,f.expected,f.name);assert.equal(r.included,f.included,f.name);
  assert.equal(r.countedCrane,f.source==='truck'?f.crane:0,f.name);
  if(f.source==='external'){assert.equal(r.externalTime,true);assert.match(r.externalNote,/PU 06-06-2016/);}
 }
});
test('A18 direct crane is restricted to tent context and counts no crane distance',()=>{
 const r=calculateTransport({source:'direct',directScope:'tent',crane:90,ground:0});
 assert.equal(r.percent,0);assert.equal(r.countedCrane,0);assert.equal(r.heightFactor,.5);
 assert.equal(calculateTransport({source:'direct',crane:90,ground:0}).valid,false);
 const remaining=calculateTransport({source:'direct',directScope:'tent',crane:90,ground:35,scaffold:20,stage:'scaffold'});
 assert.equal(remaining.valid,false);assert.equal(remaining.percent,null);assert.equal(remaining.previewPercent,21);assert.equal(remaining.groundTotal,35);
 assert.equal(remaining.clarificationCode,'A18_REMAINING_TRANSPORT');
});
test('A18 direct crane plus manual remainder is provisional until separately agreed',()=>{
 const c={source:'direct',directScope:'tent',crane:30,ground:0,scaffold:20,stage:'scaffold'};
 const unknown=calculateTransport(c);assert.equal(unknown.valid,false);assert.equal(unknown.previewPercent,14);assert.match(unknown.reason,/opstartstillæg/);
 const indicative=calculateTransport({...c,indicative:true});assert.equal(indicative.valid,true);assert.equal(indicative.provisional,true);assert.equal(indicative.percent,14);
 const agreed=calculateTransport({...c,reload:true,agreementConfirmed:true,agreementNote:'Sjak / mester: 12 % samlet resttransport inkl. omlæsning.',agreedRate:12});
 assert.equal(agreed.valid,true);assert.equal(agreed.percent,12);assert.equal(agreed.agreed,true);assert.equal(agreed.reloadPercent,0);assert.equal(agreed.agreedIncludesReload,true);assert.ok(!agreed.provisional);
 // A stale, unused scaffold input must not invent ground transport.
 assert.equal(calculateTransport({...c,stage:'ground'}).percent,0);
 // Actual deposition before manual A6 carrying remains available separately.
 assert.equal(calculateTransport({...c,source:'external'}).percent,14);
});
test('A31 reload adds once on original T base, including external transport',()=>{
 const r=calculateTransport({ground:35,scaffold:20,stage:'scaffold',reload:true});
 assert.equal(r.percent,28);assert.equal(r.reloadPercent,7);
 assert.equal(weightedResult([{...r,base:1000}]).amount,280);
 assert.equal(calculateTransport({ground:35,reload:true,excluded:true}).percent,0);
 const directRemainder=calculateTransport({ground:100,source:'direct',directScope:'tent',crane:30,reload:true,method:'wheels'});
 assert.equal(directRemainder.valid,false);assert.equal(directRemainder.previewPercent,56);
});
test('Explicit indicative result retains whole ground + scaffold preview',()=>{
 const no=calculateTransport({ground:65,scaffold:20,stage:'scaffold'}),yes=calculateTransport({ground:65,scaffold:20,stage:'scaffold',indicative:true});
 assert.equal(no.previewPercent,42);assert.equal(no.percent,null);
 assert.equal(yes.percent,42);assert.equal(yes.groundPercent,35);assert.equal(yes.scaffoldPercent,7);
 assert.equal(weightedResult([{...yes,base:1000}]).provisional,true);
});
test('Weighted example is exact and does not use highest or lowest rate',()=>{
 const r=weightedResult([{base:6000,valid:true,percent:7},{base:4000,valid:true,percent:14}]);
 assert.equal(r.amount,980);assert.equal(r.percent,9.8);assert.equal(r.base,10000);
});
test('Money rejects malformed rates and boolean amounts, zero invalid rows are harmless',()=>{
 for(const percent of [null,NaN,Infinity,-1,'7',7.001])assert.equal(weightedResult([{base:1000,valid:true,percent}]).complete,false);
 assert.equal(weightedResult([{base:true,valid:true,percent:7}]).complete,false);
 assert.equal(weightedResult([{base:1000,valid:true,percent:7},{base:0,valid:false,percent:null}]).complete,true);
 assert.equal(weightedResult([{base:0.05,valid:true,percent:10}]).amount,.01);
});
test('Exact house clipping at every ground and scaffold boundary, no 16-zone cap',()=>{
 for(const stage of ['ground','scaffold']) {
  const c={...base,length:150,depth:90,ground:25,stage,route:'cw'},r=houseZones(c);
  assert.ok(r.zones.length>16);assert.equal(r.zones.reduce((n,z)=>n+z.length,0),480);
  for(const z of r.zones)for(const fraction of [.0001,.25,.5,.75,.9999]) {
   const s=z.start+z.length*fraction,delta=route(s,c.entry,r.perimeter,z.routeDirection),g=stage==='ground'?c.ground+delta:c.ground;
   const expected=independentGround(g,c.method)+(stage==='scaffold'?7*Math.max(0,Math.ceil((delta-(g<=25?15:10))/10)):0);
   assert.equal(z.percent,expected,JSON.stringify({stage,z,s}));
  }
 }
});
test('Fractional source and corner coordinates never move a rate boundary',()=>{
 const c={...base,length:25.01,depth:9.51,entry:20.01,ground:25,route:'both'},r=houseZones(c);
 for(const z of r.zones)for(const fraction of [.0001,.9999]) {
  const s=z.start+z.length*fraction,delta=route(s,c.entry,r.perimeter,z.routeDirection);
  assert.equal(z.percent,independentGround(c.ground+delta,c.method));
 }
});
test('Multiple hoists split exact shortest-total-route intersections',()=>{
 const c={...base,stage:'scaffold',hoists:[{id:'front',position:10,ground:8},{id:'back',position:40,ground:12}]},r=houseZones(c);
 assert.ok(r.zones.some(z=>z.end===27));assert.ok(r.zones.some(z=>z.end===55));
 for(const z of r.zones)for(const fraction of [.0001,.25,.75,.9999]) {
  const s=z.start+z.length*fraction;
  const options=c.hoists.map(h=>({h,dist:routeDistance({position:Math.round(s*100)/100,origin:h.position,perimeter:r.perimeter})}));
  // Do not quantize candidate selection: use continuous independent formula.
  for(const o of options)o.dist=Math.min(route(s,o.h.position,r.perimeter,'cw'),route(s,o.h.position,r.perimeter,'ccw'));
  const chosen=options.sort((a,b)=>(a.h.ground+a.dist)-(b.h.ground+b.dist))[0];
  assert.equal(z.hoistId,chosen.h.id);
  assert.equal(z.percent,independentGround(chosen.h.ground,c.method)+7*Math.max(0,Math.ceil((chosen.dist-15)/10)));
 }
});
test('Barriers close their arc; route goes the other open way',()=>{
 const c={...base,stage:'scaffold',barriers:[{start:30,end:32}]},r=houseZones(c);
 const blocked=r.zones.find(z=>z.start===30&&z.end===32);assert.equal(blocked.unreachable,true);assert.equal(blocked.percent,null);
 const after=r.zones.find(z=>z.start===32);assert.equal(after.routeDirection,'ccw');assert.equal(after.distanceMax,42);
 for(const z of r.zones.filter(z=>z.valid))assert.ok(z.end<=30||z.start>=32);
});
test('Two point barriers make the opposite component unreachable',()=>{
 const r=houseZones({...base,barriers:[20,50]});
 assert.ok(r.zones.filter(z=>z.start>=20&&z.end<=50).every(z=>z.unreachable));
 assert.ok(r.zones.filter(z=>z.end<=20||z.start>=50).every(z=>z.valid));
});
test('Each hoist can serve one side of an otherwise divided route',()=>{
 const r=houseZones({...base,stage:'scaffold',hoists:[{id:'front',position:10,ground:8},{id:'back',position:40,ground:12}],barriers:[20,50]});
 assert.equal(r.valid,true);
 for(const z of r.zones)assert.equal(z.hoistId,z.start>=20&&z.end<=50?'back':'front');
});
test('Manual zone distances change only the selected zone and carry an audit flag',()=>{
 const before=houseZones(base),chosen=before.zones[0];
 const after=houseZones({...base,distanceOverrides:{[chosen.id]:{ground:35,crane:10}}});
 const z=after.zones.find(z=>z.id===chosen.id);assert.equal(z.percent,21);assert.equal(z.manualDistance,true);assert.equal(z.groundTotal,45);assert.match(z.geometryNote,/manuelt/);
 for(const old of before.zones.filter(z=>z.id!==chosen.id))assert.equal(after.zones.find(z=>z.id===old.id).percent,old.percent);
});
test('Reject malformed route inputs rather than guessing',()=>{
 for(const extra of [{hoists:[{id:'x',position:64}]},{hoists:[{id:'x',position:1},{id:'x',position:2}]},{barriers:[{start:70,end:80}]},{barriers:'no'},{hoists:[{position:31}],barriers:[{start:30,end:32}]}])assert.throws(()=>houseZones({...base,...extra}));
 assert.throws(()=>routeDistance({position:1,origin:0,perimeter:0}));
});
test('Seeded geometry check: 200 multi-hoist configurations retain one exact rate per zone',()=>{
 let seed=1234567;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const wrap=(x,p)=>((x%p)+p)%p;
 for(let trial=0;trial<200;trial++) {
  const length=Math.round((10+random()*100)*100)/100,depth=Math.round((5+random()*80)*100)/100,p=2*(length+depth),stage=random()<.5?'ground':'scaffold';
  const method=['manual','wheels','truck'][Math.floor(random()*3)];
  const hoists=Array.from({length:1+Math.floor(random()*3)},(_,i)=>({id:String(i),position:Math.floor(random()*p*100)/100,ground:Math.floor(random()*17000)/100}));
  const result=houseZones({length,depth,hoists,stage,method,indicative:true});
  assert.ok(Math.abs(result.zones.reduce((n,z)=>n+z.length,0)-p)<1e-7);
  for(const z of result.zones)for(const fraction of [.00001,.333,.777,.99999]) {
   const position=z.start+z.length*fraction;
   const candidates=hoists.map(h=>({h,dist:Math.min(wrap(position-h.position,p),wrap(h.position-position,p))})).sort((a,b)=>(a.h.ground+a.dist)-(b.h.ground+b.dist));
   const {h,dist}=candidates[0],g=stage==='ground'?h.ground+dist:h.ground;
   const expected=independentGround(g,method)+(stage==='scaffold'?7*Math.max(0,Math.ceil((dist-(g<=25?15:10))/10)):0);
   assert.equal(z.hoistId,h.id);assert.equal(z.percent,expected,JSON.stringify({trial,stage,method,z,position,expected}));
  }
 }
});
