import {materialPriceLine, moneyProduct} from './rule-data.mjs';

function hundredths(value,label,max=1e9){
  if((typeof value==='string'&&!value.trim())||value==null||typeof value==='boolean')throw new Error(`${label} mangler.`);
  const n=typeof value==='string'?Number(value.replace(',','.')):value;
  if(!Number.isFinite(n)||n<0||n>max||Math.abs(n*100-Math.round(n*100))>1e-5)throw new Error(`${label} skal være et positivt tal eller 0 med højst to decimaler.`);
  const cents=Math.round(n*100);
  if(!Number.isSafeInteger(cents))throw new Error(`${label} er for stort.`);
  return cents;
}
const cents=value=>hundredths(value,'Beløb');
const sumCents=values=>values.reduce((n,v)=>n+cents(v),0);
const operationOf=p=>{
  const operation=p.operation||'montage';
  if(!['montage','demontage'].includes(operation))throw new Error('Vælg montage eller demontage.');
  return operation;
};
const fractionRound=(numerator,denominator)=>Number((numerator+denominator/2n)/denominator);

/** Largest remainders preserve every øre. This allocation is a price-distribution
 * assumption, not an HP3 measurement or mandatory rounding rule. */
export function allocateCents(total,weights){
  const sum=weights.reduce((n,w)=>n+w,0);
  if(!Number.isSafeInteger(total)||total<0||!Number.isFinite(sum)||sum<=0||weights.some(w=>!Number.isFinite(w)||w<0))throw new Error('Fordelingen kan ikke beregnes.');
  const raw=weights.map(w=>total*w/sum),out=raw.map(Math.floor);
  const order=raw.map((n,i)=>({i,remainder:n-out[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
  const rest=total-out.reduce((n,v)=>n+v,0);
  for(let i=0;i<rest;i++)out[order[i].i]++;
  return out;
}
export function sideLengths(zones){
  return [...new Set(zones.map(z=>z.side))].map(side=>({side,length:zones.filter(z=>z.side===side).reduce((n,z)=>n+z.length,0)}));
}
export function defaultShares(zones){
  const sides=sideLengths(zones);
  if(!sides.length)return {};
  const parts=allocateCents(10000,sides.map(s=>s.length));
  return Object.fromEntries(sides.map((s,i)=>[s.side,parts[i]/100]));
}

/** Convert the side input units without silently reinterpreting 60% as 60 kr. */
export function convertShareUnit(zones,pricing,toUnit){
  if(!['percent','kr'].includes(toUnit))throw new Error('Vælg procent eller kroner.');
  const fromUnit=pricing.shareUnit||'percent';
  if(toUnit===fromUnit)return {...pricing};
  const sides=sideLengths(zones),shares=pricing.shares||defaultShares(zones);
  const weights=sides.map(s=>hundredths(shares[s.side],`Andel for ${s.side}`,fromUnit==='kr'?1e9:100));
  const sum=weights.reduce((n,w)=>n+w,0);
  const eligible=hundredths(pricing.montage,'Montagegrundpris')-hundredths(pricing.withoutT??0,'Grundpriser uden T');
  if(eligible<=0)throw new Error('Skriv først den fulde montagegrundpris og eventuelt grundpriser uden T.');
  if(fromUnit==='percent'&&sum!==10000)throw new Error('Fordel først 100 % i alt, før du skifter til kroner.');
  if(fromUnit==='kr'&&sum!==eligible)throw new Error('Fordel først hele T-grundlaget i kroner, før du skifter til procent.');
  const parts=allocateCents(toUnit==='kr'?eligible:10000,weights);
  return {...pricing,shareUnit:toUnit,shares:Object.fromEntries(sides.map((s,i)=>[s.side,parts[i]/100]))};
}

/** Integer-cent, integer 1/100-percent arithmetic. Sum the unrounded allowance
 * products first; round only the final money result, not each transport zone.
 * A displayed effective percentage is never fed back into the calculation. */
function transportTotal(rows){
  let baseCents=0,weighted=0n;
  const warnings=new Set();
  let provisional=false;
  for(const row of rows){
    const base=cents(row.base);
    baseCents+=base;
    if(!Number.isSafeInteger(baseCents))throw new Error('Det samlede beløb er for stort.');
    if(!base)continue;
    if(!row.valid||row.percent==null||!Number.isFinite(row.percent))throw new Error(row.reason||'Et transportstræk kræver afklaring eller en særskilt aftale.');
    const rate=hundredths(row.percent,'Transportsats',1e6);
    weighted+=BigInt(base)*BigInt(rate);
    provisional ||= !!row.provisional;
    if(row.warning)warnings.add(row.warning);
    for(const warning of row.warnings||[])warnings.add(warning);
  }
  const amountCents=fractionRound(weighted,10000n);
  const groups=[...new Set(rows.filter(r=>r.valid&&cents(r.base)>0).map(r=>r.percent))].sort((a,b)=>a-b).map(percent=>{
    const groupCents=rows.filter(r=>r.percent===percent).reduce((n,r)=>n+cents(r.base),0);
    return {percent,base:groupCents/100,amount:fractionRound(BigInt(groupCents)*BigInt(hundredths(percent,'Transportsats',1e6)),10000n)/100};
  });
  return {base:baseCents/100,transportBase:baseCents/100,
    percent:baseCents?Number(weighted)/100/baseCents:0,amount:amountCents/100,groups,
    provisional,warnings:[...warnings],rounding:(amountCents-sumCents(groups.map(g=>g.amount)))/100};
}

function finish(rows,{mode,operation,montageCents,workCents,extraCents,withoutT=0,materialRows=[]}){
  const total=transportTotal(rows);
  const amountCents=cents(total.amount),sevenCents=fractionRound(BigInt(cents(total.base))*7n,100n);
  const all=workCents+extraCents+amountCents;
  return {...total,complete:true,mode,operation,rows,materialRows,
    montage:montageCents/100,withoutT,workBase:workCents/100,extras:extraCents/100,
    sevenAmount:sevenCents/100,difference:(amountCents-sevenCents)/100,
    workWithTransport:all/100,montageWithTransport:all/100,
    formula:`${workCents/100} kr.${extraCents?` + ${extraCents/100} kr. øvrige beløb`:''} + ${total.amount} kr. transport = ${all/100} kr.`};
}

/** Explicit manually verified price row for material outside the selection.
 * A non-G line can never become a T basis, even if T is entered incorrectly. */
function customMaterialLine(material,operation){
  if(material.G!==true&&material.G!==false)throw new Error('Angiv G/T/H for en manuelt prissat materialelinje.');
  if(!String(material.label||'').trim()||!String(material.ref||'').trim())throw new Error('En manuel materialelinje kræver navn og prisrække/regelhenvisning.');
  if((typeof material.quantity==='string'&&!material.quantity.trim())||material.quantity==null||typeof material.quantity==='boolean')throw new Error('Materialemængden mangler.');
  const quantity=Number(String(material.quantity).replace(',','.'));
  if(!Number.isFinite(quantity)||quantity<0)throw new Error('Materialemængden er ugyldig.');
  const rate=cents(material.rate)/100;
  const factorInput=material.demontageFactor??(material.G?.5:1);
  if(operation==='demontage'&&!material.mountOnly&&((typeof factorInput==='string'&&!factorInput.trim())||typeof factorInput==='boolean'))throw new Error('Demontagefaktoren mangler eller er ugyldig.');
  const factor=operation==='demontage'?(material.mountOnly?0:Number(String(factorInput).replace(',','.'))):1;
  if(!Number.isFinite(factor)||factor<0||factor>1)throw new Error('Demontagefaktoren er ugyldig.');
  const fullAmount=moneyProduct(rate,quantity),workAmount=moneyProduct(rate,quantity,factor);
  return {...material,operation,fullAmount,fullBase:material.G?fullAmount:0,workAmount,
    tBase:material.G&&material.T?fullAmount:0,hBase:material.G&&material.H?workAmount:0,
    otherAmount:material.G?0:workAmount,formula:`${quantity} × ${rate}${factor!==1?` × ${factor}`:''}`};
}

/** Full montage G is entered BEFORE demontage. A13 halves work G; A8/pkt.27
 * retain the full T-eligible montage G. uniform/sides are stated estimates;
 * zones preserves legacy exact T amounts; precise has material G/T/H flags. */
export function housePriceResult(zones,pricing={},amounts={}){
  const mode=pricing.mode||'uniform';
  try{
    if(!Array.isArray(zones)||!zones.length)throw new Error('Der mangler transportområder.');
    const operation=operationOf(pricing),factor=operation==='demontage'?.5:1;
    let rows,montageCents,workCents,withoutT=0,extraCents=hundredths(pricing.extra??0,'Øvrige beløb'),materialRows=[];
    if(mode==='precise'){
      if(!Array.isArray(pricing.materials)||!pricing.materials.length)throw new Error('Tilføj mindst én materialelinje med område, mængde og prisrække.');
      materialRows=pricing.materials.map(material=>{
        const line=material.itemId?materialPriceLine({...material,operation}):customMaterialLine(material,operation);
        const zone=zones.find(z=>z.id===material.zoneId);
        if(!zone&&line.tBase>0)throw new Error('Et materiale mangler et gyldigt transportområde. Ruten kan være ændret.');
        return {...line,zoneId:material.zoneId,zoneName:zone?.side||'Uden T'};
      });
      montageCents=sumCents(materialRows.map(m=>m.fullBase));
      const allWork=sumCents(materialRows.map(m=>m.workAmount)),other=sumCents(materialRows.map(m=>m.otherAmount));
      workCents=allWork-other;extraCents+=other;
      rows=zones.map(zone=>({...zone,base:sumCents(materialRows.filter(m=>m.zoneId===zone.id).map(m=>m.tBase))/100}));
      withoutT=(montageCents-sumCents(materialRows.map(m=>m.tBase)))/100;
    }else if(mode==='zones'){
      rows=zones.map(z=>({...z,base:amounts[z.id]}));
      const transportCents=sumCents(rows.map(r=>r.base)),excludedCents=hundredths(pricing.withoutT??0,'Grundpriser uden transporttillæg');
      montageCents=transportCents+excludedCents;withoutT=excludedCents/100;
      workCents=cents(moneyProduct(montageCents/100,factor));
    }else{
      if(!['uniform','sides'].includes(mode))throw new Error('Vælg en prisfordeling.');
      montageCents=hundredths(pricing.montage,'Din fulde montagegrundpris');
      const excludedCents=hundredths(pricing.withoutT??0,'Grundpriser uden transporttillæg');
      if(excludedCents>montageCents)throw new Error('Grundpriser uden T må ikke være større end montagegrundprisen.');
      if(montageCents===excludedCents)throw new Error('Der skal være en grundpris med ret til transporttillæg. Brug Præcis til materiel uden T.');
      withoutT=excludedCents/100;workCents=cents(moneyProduct(montageCents/100,factor));
      const eligibleCents=montageCents-excludedCents;
      let allocations;
      if(mode==='sides'){
        const sides=sideLengths(zones),isKr=pricing.shareUnit==='kr';
        const shares=sides.map(s=>hundredths(pricing.shares?.[s.side],`Andel for ${s.side}`,isKr?1e9:100));
        const sum=shares.reduce((n,v)=>n+v,0);
        if(!isKr&&sum!==10000)throw new Error(`Fordel i alt 100 % på siderne. Nu: ${(sum/100).toLocaleString('da-DK')} %.`);
        if(isKr&&sum!==eligibleCents)throw new Error(`Sidebeløbene skal tilsammen være ${(eligibleCents/100).toLocaleString('da-DK')} kr. Nu: ${(sum/100).toLocaleString('da-DK')} kr.`);
        const sideCents=isKr?shares:allocateCents(eligibleCents,shares);
        allocations=zones.map(()=>0);
        sides.forEach((side,i)=>{
          const indexes=zones.map((z,index)=>({z,index})).filter(v=>v.z.side===side.side),parts=allocateCents(sideCents[i],indexes.map(v=>v.z.length));
          indexes.forEach((v,j)=>{allocations[v.index]=parts[j];});
        });
      }else allocations=allocateCents(eligibleCents,zones.map(z=>z.length));
      rows=zones.map((z,i)=>({...z,base:allocations[i]/100}));
    }
    if(montageCents+workCents+extraCents<=0)throw new Error('Indtast et beløb eller en materialemængde større end 0.');
    return finish(rows,{mode,operation,montageCents,workCents,extraCents,withoutT,materialRows});
  }catch(e){return {complete:false,percent:null,amount:null,base:0,mode,rows:[],reason:e.message};}
}

/** One full montage G input and one calculated transport route. */
export function quickPriceResult({base,montage,withoutT=0,extra=0,operation='montage',transport}={}){
  const result=housePriceResult([{id:'quick',side:'Transportvej',length:1,...transport}],{montage:base??montage,withoutT,extra,operation});
  if(!result.complete&&transport?.previewPercent!=null){
    result.previewPercent=transport.previewPercent;
    try{const eligible=hundredths(base??montage,'Montagepris')-hundredths(withoutT,'Grundpriser uden T');
      if(eligible>=0)result.previewAmount=fractionRound(BigInt(eligible)*BigInt(hundredths(transport.previewPercent,'Vejledende sats')),10000n)/100;
    }catch{}
  }
  return {...result,mode:'quick'};
}
