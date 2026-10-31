import {test} from 'node:test';
import assert from 'node:assert/strict';
import {houseZones,weightedResult,calculateTransport} from '../dist/engine.mjs';
import {housePriceResult,quickPriceResult,allocateCents,defaultShares,convertShareUnit} from '../dist/transport-price.mjs';
import {priceSummary} from '../dist/transport-price-view.mjs';

const zone=(id,side,length,percent)=>({id,side,length,percent,valid:true});
test('User example: 1,000 montage + 7% transport = 1,070, not just the allowance',()=>{
 const r=housePriceResult([zone('a','Forside',20,7)],{montage:1000});
 assert.equal(r.percent,7);assert.equal(r.amount,70);assert.equal(r.montageWithTransport,1070);assert.equal(r.difference,0);
 assert.match(priceSummary(r,true),/1.070,00 kr\./);
});
test('Equal material price per metre: all of montage is allocated, distant parts add more',()=>{
 const r=housePriceResult([zone('a','Forside',20,7),zone('b','Bagside',20,14)],{montage:1000});
 assert.equal(r.percent,10.5);assert.equal(r.base,1000);assert.equal(r.amount,105);assert.equal(r.montageWithTransport,1105);assert.equal(r.difference,35);
 assert.deepEqual(r.groups,[{percent:7,base:500,amount:35},{percent:14,base:500,amount:70}]);
});
test('Unequal lengths are price weights only under the equal-price assumption',()=>{
 const r=housePriceResult([zone('a','Forside',10,7),zone('b','Bagside',30,14)],{montage:1000});
 assert.equal(r.percent,12.25);assert.equal(r.amount,122.5);assert.deepEqual(r.rows.map(z=>z.base),[250,750]);
});
test('Custom facade price shares replace length shares and allow an empty facade',()=>{
 const zones=[zone('a','Forside',5,7),zone('b','Forside',5,14),zone('c','Bagside',20,21),zone('d','Højre gavl',10,28),zone('e','Venstre gavl',10,7)];
 const r=housePriceResult(zones,{mode:'sides',montage:1000,shares:{Forside:20,Bagside:80,'Højre gavl':0,'Venstre gavl':0}});
 assert.deepEqual(r.rows.map(z=>z.base),[100,100,800,0,0]);assert.equal(r.percent,18.9);assert.equal(r.amount,189);
 assert.equal(housePriceResult(zones,{mode:'sides',montage:1000,shares:{Forside:20,Bagside:70,'Højre gavl':0,'Venstre gavl':0}}).complete,false);
});
test('Prices without T are excluded once; montage itself stays in the final sum',()=>{
 const r=housePriceResult([zone('a','Forside',20,14)],{montage:1000,withoutT:200});
 assert.equal(r.base,800);assert.equal(r.amount,112);assert.equal(r.montageWithTransport,1112);assert.equal(r.sevenAmount,56);assert.equal(r.difference,56);
});
test('Each øre is allocated once, even when shares and distances are awkward',()=>{
 for(const cents of [1,2,7,101,224160,99999999]){
  const parts=allocateCents(cents,[1,2,7,11,31]);assert.equal(parts.reduce((a,b)=>a+b,0),cents);
  for(const [i,w] of [1,2,7,11,31].entries())assert.ok(Math.abs(parts[i]-cents*w/52)<1);
 }
 const zones=[zone('a','A',1,7),zone('b','B',1,14),zone('c','C',1,21)];
 assert.deepEqual(defaultShares(zones),{A:33.34,B:33.33,C:33.33});
 const r=housePriceResult(zones,{montage:'2241,60'});assert.equal(r.base,2241.6);assert.equal(r.rows.reduce((n,z)=>n+Math.round(z.base*100),0),224160);
});
test('Invalid or incomplete inputs cannot yield money or a saveable result',()=>{
 const zones=[zone('a','A',10,7)];
 for(const montage of ['',null,true,-1,NaN,Infinity,1.001,'abc',0])assert.equal(housePriceResult(zones,{montage}).complete,false);
 assert.equal(housePriceResult(zones,{montage:1000,withoutT:1001}).complete,false);
 assert.equal(housePriceResult(zones,{montage:1000,withoutT:1000}).complete,false);
 assert.equal(housePriceResult([{...zones[0],valid:false,percent:null}],{montage:1000}).complete,false);
 assert.throws(()=>allocateCents(100,[0,0]));
});
test('Legacy exact zone amounts and price weights are preserved',()=>{
 const zones=[zone('a','Forside',100,7),zone('b','Bagside',1,28)];
 const r=housePriceResult(zones,{mode:'zones'},{a:1000,b:3000});
 assert.equal(r.percent,22.75);assert.equal(r.amount,910);assert.equal(r.base,4000);assert.equal(r.montageWithTransport,4910);
 assert.equal(housePriceResult(zones,{mode:'zones'},{a:1000,b:''}).complete,false);
});
test('House geometry: one total price works with one/both routes, cranes and scaffold legs',()=>{
 for(const route of ['both','cw','ccw'])for(const stage of ['ground','scaffold']){
  const r=houseZones({length:47,depth:12,entry:5,ground:10,crane:5,route,stage,method:'wheels'});
  const p=housePriceResult(r.zones,{montage:2241.6});
  assert.equal(p.complete,true);assert.equal(p.base,2241.6);assert.ok(p.percent>7);assert.ok(p.difference>0);
  const independent=weightedResult(p.rows);assert.equal(p.amount,independent.amount);assert.ok(Math.abs(p.percent-independent.percent)<1e-12);
 }
});
test('Side allocation honours the selected facade amounts before splitting into zones',()=>{
 const zones=houseZones({length:20,depth:12,entry:10,ground:8,route:'both',stage:'ground',method:'manual'}).zones;
 const shares=defaultShares(zones),p=housePriceResult(zones,{mode:'sides',montage:1000,shares});
 for(const [side,percent] of Object.entries(shares))assert.equal(p.rows.filter(z=>z.side===side).reduce((n,z)=>n+Math.round(z.base*100),0),Math.round(percent*1000));
});

test('A13 halves demontage G but A8/pkt.27 retain the full T basis',()=>{
 const r=quickPriceResult({base:1000,operation:'demontage',transport:calculateTransport({ground:25})});
 assert.equal(r.complete,true);assert.equal(r.base,1000);assert.equal(r.workBase,500);assert.equal(r.amount,70);assert.equal(r.workWithTransport,570);
 assert.match(priceSummary(r,true),/Nedtagningsgrundpris/);assert.match(priceSummary(r,true),/1.000,00 kr\. fuldt T-grundlag/);
});
test('Demontage never halves T, even when part of G has no T',()=>{
 const r=housePriceResult([zone('a','Forside',20,14)],{montage:1000,withoutT:200,operation:'demontage'});
 assert.equal(r.montage,1000);assert.equal(r.workBase,500);assert.equal(r.base,800);assert.equal(r.amount,112);assert.equal(r.montageWithTransport,612);
});
test('Other allowances stay out of T and are added once with their entered net amount',()=>{
 const r=quickPriceResult({base:1000,extra:300,operation:'demontage',transport:{valid:true,percent:7}});
 assert.equal(r.amount,70);assert.equal(r.workBase,500);assert.equal(r.extras,300);assert.equal(r.workWithTransport,870);
});
test('Requested 6,000 front / 4,000 rear example: 980 allowance = 9.8 percent',()=>{
 const zones=[zone('a','Forside',10,7),zone('b','Bagside',60,14)];
 for(const p of [
  {mode:'sides',montage:10000,shares:{Forside:60,Bagside:40}},
  {mode:'sides',montage:10000,shareUnit:'kr',shares:{Forside:6000,Bagside:4000}}
 ]){
  const r=housePriceResult(zones,p);
  assert.equal(r.complete,true);assert.equal(r.amount,980);assert.equal(r.percent,9.8);assert.equal(r.workWithTransport,10980);
  assert.deepEqual(r.rows.map(x=>x.base),[6000,4000]);
 }
});
test('Kroner shares must equal the eligible G amount, including without-T deduction',()=>{
 const zones=[zone('a','Forside',10,7),zone('b','Bagside',20,14)];
 const p={mode:'sides',montage:1000,withoutT:200,shareUnit:'kr',shares:{Forside:300,Bagside:500}};
 assert.equal(housePriceResult(zones,p).amount,91);
 assert.equal(housePriceResult(zones,{...p,shares:{Forside:300,Bagside:499.99}}).complete,false);
});
test('Unrounded allowance products are summed before money rounding, independent of zone count',()=>{
 const one=housePriceResult([zone('a','A',1,7)],{mode:'zones'},{a:0.08});
 const split=housePriceResult([zone('a','A',1,7),zone('b','A',1,7)],{mode:'zones'},{a:0.04,b:0.04});
 assert.equal(one.amount,0.01);assert.equal(split.amount,0.01);assert.equal(split.workWithTransport,0.09);
 assert.equal(split.groups.length,1);assert.equal(split.groups[0].amount,0.01);
});
test('Displayed effective percent does not round the allowance prematurely',()=>{
 const rows=[zone('a','A',1,7),zone('b','B',1,14),zone('c','C',1,28)];
 const r=housePriceResult(rows,{mode:'zones'},{a:1000.01,b:1000.02,c:999.99});
 assert.equal(r.complete,true);
 const exactCents=Number((100001n*700n+100002n*1400n+99999n*2800n+5000n)/10000n);
 assert.equal(r.amount,exactCents/100);
 assert.equal(Math.round(r.workWithTransport*100),300002+exactCents);
});
test('Manual >55 remains unconfirmed, with an explicitly labelled preview',()=>{
 const t=calculateTransport({ground:55.01,method:'manual'});
 const r=quickPriceResult({base:1000,transport:t});
 assert.equal(r.complete,false);assert.equal(r.amount,null);assert.equal(r.previewPercent,35);assert.equal(r.previewAmount,350);
 assert.match(priceSummary(r,false),/Vejledende pkt\. 27-beregning/);
});
test('Explicit indicative mode propagates and is blocked from saving an unconditional claim',()=>{
 const t=calculateTransport({ground:55.01,method:'manual',indicative:true});
 const r=quickPriceResult({base:1000,transport:t});
 assert.equal(r.complete,true);assert.equal(r.provisional,true);assert.equal(r.amount,350);
 const html=priceSummary(r,true);
 assert.match(html,/Vejledende beregning/);assert.match(html,/data-action="save-house" disabled/);
});
test('A documented agreed transport rate can be stored without an indicative claim',()=>{
 const t=calculateTransport({ground:80,method:'manual',agreedRate:38.5,agreementConfirmed:true,agreementNote:'Aftalt særskilt transport 31/10 med virksomheden.'});
 const r=quickPriceResult({base:1000,transport:t});
 assert.equal(r.complete,true);assert.equal(r.provisional,false);assert.equal(r.amount,385);
});
test('Crane assembly exclusion does not add any percentage for the excluded leg',()=>{
 const r=quickPriceResult({base:1000,transport:{valid:true,percent:0,excluded:true}});
 assert.equal(r.complete,true);assert.equal(r.amount,0);assert.equal(r.workWithTransport,1000);
});
test('Precise materials keep G-only, GH and non-G rows out of T',()=>{
 const zones=[zone('a','Forside',25,7)];
 const materials=[
  {id:'m1',itemId:'1a',quantity:10,zoneId:'a'},
  {id:'m2',itemId:'5l',quantity:10,zoneId:'a'},
  {id:'m3',itemId:'15a',quantity:10,zoneId:'a'},
  {id:'m4',itemId:'12i',quantity:2,zoneId:'a'},
  {id:'m5',itemId:'20a',quantity:2,zoneId:'a'}
 ];
 const r=housePriceResult(zones,{mode:'precise',materials});
 assert.equal(r.complete,true);assert.equal(r.base,27.5);assert.equal(r.montage,190);assert.equal(r.workBase,190);assert.equal(r.extras,90.04);
 assert.equal(r.amount,1.93);assert.equal(r.workWithTransport,281.97);
 assert.deepEqual(r.materialRows.map(m=>m.tBase),[27.5,0,0,0,0]);
});
test('Precise demontage preserves full T, removes montage-only cutting, and keeps barrier price',()=>{
 const zones=[zone('a','Forside',25,7)];
 const materials=[
  {itemId:'1a',quantity:10,zoneId:'a'},
  {itemId:'5l',quantity:10,zoneId:'a'},
  {itemId:'15a',quantity:10,zoneId:'a'},
  {itemId:'12i',quantity:2,zoneId:'a'},
  {itemId:'20a',quantity:2,zoneId:'a'}
 ];
 const r=housePriceResult(zones,{mode:'precise',operation:'demontage',materials});
 assert.equal(r.complete,true);assert.equal(r.base,27.5);assert.equal(r.workBase,95);assert.equal(r.extras,42.44);
 assert.equal(r.amount,1.93);assert.equal(r.workWithTransport,139.37);
 assert.deepEqual(r.materialRows.map(m=>m.workAmount),[13.75,50.1,31.15,0,42.44]);
});
test('Precise mode can correctly produce zero transport for materials with no T',()=>{
 const r=housePriceResult([zone('a','A',1,7)],{mode:'precise',materials:[{itemId:'5l',quantity:1}]});
 assert.equal(r.complete,true);assert.equal(r.base,0);assert.equal(r.amount,0);assert.equal(r.workWithTransport,10.02);
});
test('A route change invalidates a material location rather than silently reallocating it',()=>{
 const r=housePriceResult([zone('new','A',1,7)],{mode:'precise',materials:[{itemId:'1a',quantity:10,zoneId:'old'}]});
 assert.equal(r.complete,false);assert.match(r.reason,/transportområde/);
});
test('Unpriced custom materials require source and explicit G flag; non-G cannot receive T',()=>{
 const zones=[zone('a','A',1,7)];
 const line={zoneId:'a',quantity:3,rate:10,G:false,T:true,H:true,label:'Supplerende prisrække',ref:'Priskurant pkt. valgt af bruger'};
 const r=housePriceResult(zones,{mode:'precise',materials:[line]});
 assert.equal(r.complete,true);assert.equal(r.amount,0);assert.equal(r.workBase,0);assert.equal(r.extras,30);
 assert.equal(housePriceResult(zones,{mode:'precise',materials:[{...line,ref:''}]}).complete,false);
 assert.equal(housePriceResult(zones,{mode:'precise',materials:[{...line,G:undefined}]}).complete,false);
});
test('Teltmaterial precise input demands A35 confirmation and follows cm rule',()=>{
 const zones=[zone('a','A',1,7)];
 const m={zoneId:'a',itemId:'19h',quantity:80};
 assert.equal(housePriceResult(zones,{mode:'precise',materials:[m]}).complete,false);
 const r=housePriceResult(zones,{mode:'precise',materials:[{...m,correctTentBasis:true}]});
 assert.equal(r.complete,true);assert.equal(r.base,45.58);assert.equal(r.amount,3.19);
});

test('Switching side-share units converts prices instead of reinterpreting the same numbers',()=>{
 const zones=[zone('a','Forside',10,7),zone('b','Bagside',60,14)];
 const p={mode:'sides',montage:10000,shares:{Forside:60,Bagside:40}};
 const kroner=convertShareUnit(zones,p,'kr');
 assert.deepEqual(kroner.shares,{Forside:6000,Bagside:4000});
 assert.equal(housePriceResult(zones,kroner).amount,980);
 assert.deepEqual(convertShareUnit(zones,kroner,'percent').shares,p.shares);
 assert.throws(()=>convertShareUnit(zones,{...p,montage:''},'kr'));
});
test('Custom demontage factor from an HTML field is parsed as a decimal without changing the T basis',()=>{
 const r=housePriceResult([zone('a','A',1,7)],{mode:'precise',operation:'demontage',materials:[{
  zoneId:'a',label:'Verificeret materiale',ref:'HP3 valgt prisrække',quantity:'10',rate:'10',G:true,T:true,H:true,demontageFactor:'0,5'
 }]});
 assert.equal(r.complete,true);assert.equal(r.workBase,50);assert.equal(r.base,100);assert.equal(r.amount,7);assert.equal(r.workWithTransport,57);
});
