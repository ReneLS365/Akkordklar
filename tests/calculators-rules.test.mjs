import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CALCULATORS,defaults,runCalculator,splitIntroAkkord,calculatorFieldVisible} from '../dist/calculators.mjs';
import {MATERIALS,materialPriceLine,moneyProduct,PRICE_NOTE} from '../dist/rule-data.mjs';
const run=(id,changes={})=>runCalculator(id,{...defaults(CALCULATORS.find(c=>c.id===id)),...changes});

test('A14 demontage halves eligible G only; excludes 26/27 and keeps other 1–25 sums',()=>{
 const small=run('minimum',{base:800,demolition:true,other:0});
 assert.equal(small.priceSum,400);assert.equal(small.rightToHourly,true);
 const notSmall=run('minimum',{base:800,demolition:true,other:100});
 assert.equal(notSmall.priceSum,500);assert.equal(notSmall.rightToHourly,false);
 assert.equal(run('minimum',{base:985.12,demolition:true}).rightToHourly,false);
 assert.equal(run('minimum',{base:985.10,demolition:true}).rightToHourly,true);
 const halfCent=run('minimum',{base:985.11,demolition:true});
 assert.equal(halfCent.valid,false);assert.equal(halfCent.requiresClarification,true);
 assert.equal(halfCent.priceSum,492.555);assert.match(halfCent.reason,/492,555/);
});
test('A36 proportional column rate is not rounded per piece before the line sum',()=>{
 assert.equal(run('column',{one:8.58,length:1.23,count:100}).amount,1055.34);
 assert.equal(run('column',{one:8.58,length:0.5,count:10}).amount,42.90);
});
test('A20 uses the closest applicable module and requires clarification at exact ties',()=>{
 assert.equal(run('moduleLength',{length:2.57}).moduleLength,2.5);
 assert.equal(run('moduleLength',{length:2.75}).valid,false);
 assert.equal(run('moduleLength',{length:1.31,modules:'1,25; 1,5'}).moduleLength,1.25);
 assert.equal(run('moduleLength',{modules:'ingen moduler'}).valid,false);
});
test('19h centimetres are proportional and require A35 price confirmation',()=>{
 assert.equal(run('ridgeBeam').valid,false);
 const result=run('ridgeBeam',{correctBase:true,cm:225,count:2});
 assert.equal(result.amount,256.41);
 assert.equal(result.fullTransportBase,256.41);
 assert.equal(run('ridgeBeam',{correctBase:true,cm:225,count:2,demolition:true}).amount,128.21);
});
test('A10 vertical beam splits its G by actual height, excluding the part below 18',()=>{
 assert.equal(run('verticalBeamHeight',{bottom:16,top:24,base:800}).amount,180);
 assert.equal(run('verticalBeamHeight',{bottom:24,top:28,base:400}).amount,200);
 assert.equal(run('verticalBeamHeight',{bottom:10,top:17,base:700}).amount,0);
 assert.equal(run('verticalBeamHeight',{bottom:16,top:24,base:800,tentCrane:true}).amount,90);
 assert.equal(run('verticalBeamHeight',{bottom:16,top:23,base:700}).amount,150);
 assert.equal(run('verticalBeamHeight',{bottom:16,top:53,base:800}).valid,false);
 assert.equal(run('verticalBeamHeight',{bottom:16,top:53,base:800,paidHoisting:true}).amount,0);
});
test('H crane scope stays specific to A18, not a universal discount',()=>{
 assert.equal(run('height',{kind:'part',crane:true}).valid,false);
 assert.equal(run('height',{kind:'tent',crane:true,eaves:26,ridge:30}).percent,35);
});
test('A11 montagedæk need a full field and suitable decks, not traller',()=>{
 assert.equal(run('assemblyDeck',{fullField:false}).valid,false);
 assert.equal(run('assemblyDeck',{traller:true}).valid,false);
 assert.equal(run('assemblyDeck',{base:1000,distance:2,fullField:true,traller:false}).amount,1000);
});
test('G1 and G3 short moves use 100% G with no T, including during dismantling',()=>{
 assert.equal(run('shortMove',{kind:'rail',rooms:11,moves:2,distance:2}).amount,220.44);
 assert.equal(run('shortMove',{kind:'console',base:123.45,moves:3}).amount,370.35);
 assert.equal(run('shortMove',{distance:2.01}).valid,false);
 assert.equal(run('shortMove',{kind:'rail',rooms:1.5}).valid,false);
 assert.equal(run('shortMove').transportEligible,false);
});
for(const [event,factor]of [['start',1],['finish',1],['openclose',0],['alongRoad',1],['courtyard',1],['cycleGate',1]]){
 test(`A26 event ${event} pays ${factor} full prices`,()=>{
  const r=run('barrier',{signs:2,cylinders:3,boards:4,event,times:1});
  assert.equal(r.amount,100.07*factor);
  assert.equal(r.transportEligible,false);
 });
}
test('A26 does not invent repeated starts or halve home-taking',()=>{
 assert.equal(run('barrier',{event:'start',times:2}).valid,false);
 assert.equal(run('barrier',{event:'finish',signs:1,cylinders:0,boards:0}).amount,21.22);
 assert.equal(run('barrier',{event:'alongRoad',times:3,signs:1,cylinders:0,boards:0}).amount,63.66);
});
test('A22/A28 cuts require real fitting, are non-G, and are not paid on demontage',()=>{
 assert.equal(run('tightCover',{area:10,cuts:2,realCuts:false}).valid,false);
 const r=run('tightCover',{area:10,cuts:2,realCuts:true});
 assert.equal(r.amount,131.90);assert.equal(r.nonG,47.60);
 assert.equal(r.fullTransportBase,84.30);assert.equal(r.heightBase,84.30);
 const d=run('tightCover',{area:10,cuts:2,realCuts:false,demolition:true});
 assert.equal(d.amount,42.15);assert.equal(d.nonG,0);
 assert.equal(d.fullTransportBase,84.30);assert.equal(d.heightBase,42.15);
 assert.equal(run('tightCover',{area:12.5,cuts:0}).amount,109.59);
});
test('A23 measures mounted box screen above floor, with exact 1m band',()=>{
 assert.equal(run('boxScreen',{height:1,rooms:2}).amount,57.48);
 assert.equal(run('boxScreen',{height:1.01,rooms:2}).amount,104.36);
 assert.equal(run('boxScreen',{height:1.8,rooms:2,demolition:true}).amount,52.18);
 assert.equal(run('boxScreen',{height:1.81}).valid,false);
});
test('Mixed-day driving follows the four Hvidbog shift patterns',()=>{
 const x={transitionsConfirmed:true,out:30,between:40,home:50,freeKm:20,people:1};
 assert.equal(run('travelMixed',{...x,pattern:'hourlyFirst'}).eligibleKm,90);
 assert.equal(run('travelMixed',{...x,pattern:'hourlyFirst'}).amount,152.60);
 assert.equal(run('travelMixed',{...x,pattern:'accordFirst'}).amount,21.80);
 assert.equal(run('travelMixed',{...x,pattern:'interrupted'}).eligibleKm,80);
 assert.equal(run('travelMixed',{...x,pattern:'interrupted'}).amount,130.80);
 assert.equal(run('travelMixed',{...x,pattern:'hourly'}).amount,0);
 assert.equal(run('travelMixed',{...x,freeKm:21}).valid,false);
 assert.equal(run('travelMixed',{...x,transitionsConfirmed:false}).valid,false);
});
test('2026 education rates use their own relevant hours and require qualification',()=>{
 assert.equal(run('education').valid,false);
 assert.equal(run('education',{qualified:true,level:'1',hours:8,people:1}).amount,353.12);
 assert.equal(run('education',{qualified:true,level:'2',hours:8,people:2}).amount,811.36);
});
test('Mentor ≤5-day exception applies to the described temporary substitute only',()=>{
 assert.equal(run('mentor').valid,false);
 const x={qualified:true,hours:8,loaned:true,loanDays:5,normalMentor:false,otherAgreement:false};
 assert.equal(run('mentor',x).amount,0);
 assert.equal(run('mentor',{...x,loanDays:6}).amount,182.88);
 assert.equal(run('mentor',{...x,normalMentor:true}).amount,182.88);
 assert.equal(run('mentor',{...x,otherAgreement:true}).amount,182.88);
 assert.equal(run('mentor',{qualified:true,hours:8,learners:2}).amount,182.88);
 assert.equal(run('mentor',{qualified:true,learners:3}).valid,false);
});
test('60/40 uses actual weighted hours and every øre is assigned exactly once',()=>{
 const x=splitIntroAkkord(10000,[{hours:14,intro:false},{hours:14,intro:false},{hours:18,intro:false},{hours:18,intro:true}]);
 assert.equal(x.weightedHours,34.8);
 assert.equal(x.rows.at(-1).weightedHours,7.2);
 assert.equal(x.rows.reduce((sum,m)=>sum+Math.round(m.amount*100),0),1000000);
 assert.equal(splitIntroAkkord(1000,[{hours:8,intro:false},{hours:8,intro:true}]).rows[0].amount,600);
 assert.deepEqual(splitIntroAkkord(1000,[{hours:8,intro:true},{hours:8,intro:true}]).rows.map(m=>m.amount),[500,500]);
 assert.deepEqual(splitIntroAkkord(1000,[{hours:8,intro:false},{hours:4,intro:false}]).rows.map(m=>m.amount),[666.67,333.33]);
 assert.equal(run('introSplit').noAdd,true);
});
test('Accounting products round decimal values only once and guard invalid inputs',()=>{
 assert.equal(moneyProduct(56.98,.01,225,2),256.41);
 assert.equal(moneyProduct(0.005),.01);
 assert.throws(()=>moneyProduct(-1),/ikke-negativt/);
 assert.throws(()=>materialPriceLine({itemId:'unknown',quantity:1}),/Ukendt/);
 assert.throws(()=>materialPriceLine({itemId:'5l',quantity:1.5}),/hele/);
});
test('G/T/H exclusions follow their actual price-row marks',()=>{
 for(const id of ['5l','5m','16a','16b']){const m=MATERIALS.find(m=>m.id===id);assert.deepEqual([m.G,m.T,m.H],[true,false,false]);}
 for(const id of ['15a','15b','15c','15d','15e']){const m=MATERIALS.find(m=>m.id===id);assert.deepEqual([m.G,m.T,m.H],[true,false,true]);}
 for(const id of ['12i','13i','13j','13k','13l','13m','13n','15f','16d','20a','20b','20c']){const m=MATERIALS.find(m=>m.id===id);assert.deepEqual([m.G,m.T,m.H],[false,false,false]);}
 const t=materialPriceLine({itemId:'3e',quantity:10,operation:'demontage'});
 assert.equal(t.fullBase,171.6);assert.equal(t.workAmount,85.8);
 assert.equal(t.tBase,171.6);assert.equal(t.hBase,85.8);assert.equal(t.otherAmount,0);
 assert.equal(materialPriceLine({itemId:'20a',quantity:1,operation:'demontage'}).workAmount,21.22);
 assert.equal(materialPriceLine({itemId:'12i',quantity:2,operation:'demontage'}).workAmount,0);
 assert.equal(materialPriceLine({itemId:'13n',quantity:2,operation:'demontage'}).otherAmount,5.64);
});
test('Verified decks, stairs, traller and toeboards match HP3 2026 with GTH',()=>{
 const expected={'7.1g':12.87,'7.1h':17.16,'7.1i':21.44,'7.2g':8.58,'7.3g':6.43,'7.4b':17.16,'8g':10.72,'8h':16.08,'9a':8.58,'9c':15.02,'9d':10.72,'10a':52.71,'10d':12.89,'10g':12.59,'11a':6.43,'11g':8.58,'11h':9.65,'11i':10.72,'11j':12.87,'11k':1.17};
 for(const [id,rate]of Object.entries(expected)){
  const item=MATERIALS.find(m=>m.id===id);
  assert.ok(item,id);assert.equal(item.rate,rate,id);
  assert.deepEqual([item.G,item.T,item.H],[true,true,true],id);
  assert.equal(materialPriceLine({itemId:id,quantity:2,operation:'demontage'}).tBase,moneyProduct(rate,2),id);
 }
 assert.equal(new Set(MATERIALS.map(m=>m.id)).size,MATERIALS.length);
});
test('Catalogue unit rules and A35 are explicit rather than guessed',()=>{
 assert.equal(materialPriceLine({itemId:'14b',quantity:12.5}).workAmount,53.30);
 assert.equal(materialPriceLine({itemId:'15e',quantity:2.01}).workAmount,42.42);
 assert.equal(materialPriceLine({itemId:'16a',quantity:30.5}).workAmount,90.83);
 assert.throws(()=>materialPriceLine({itemId:'19h',quantity:225}),/A35/);
 assert.equal(materialPriceLine({itemId:'19h',quantity:225,correctTentBasis:true}).workAmount,128.21);
 assert.match(PRICE_NOTE,/2025/);
});
test('Old saved inputs merge defaults; new conditional UI fields hide irrelevant inputs',()=>{
 assert.equal(runCalculator('minimum',{base:400}).valid,true);
 const c=CALCULATORS.find(c=>c.id==='shortMove');
 assert.equal(calculatorFieldVisible(c,{id:'base'},{kind:'rail'}),false);
 assert.equal(calculatorFieldVisible(c,{id:'rooms'},{kind:'console'}),false);
});
