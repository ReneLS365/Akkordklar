/** Versioned quantity → actual route → existing HP3 pricing pipeline. */
import {MATERIALS,materialPriceLine,moneyProduct,PRICE_VERSION} from './rule-data.mjs';
import {calculateTransport} from './engine.mjs';
import {housePriceResult} from './transport-price.mjs';
import {runCalculator} from './calculators.mjs';
export const TALLY_VERSION=1;
export const units={piece:'stk.',m:'m',lbm:'lbm.',sqm:'m²',room:'rum',cm:'cm'};
export const groups={1:'Fødder',2:'Rammer',3:'Søjler',4:'Horisontaler og diagonaler',5:'Gelændere',6:'Konsoller',7:'Dæk og opgang',8:'Ståldæk',9:'Traller',10:'Trapper og planker',11:'Fodlister',12:'Skærme og finér',13:'Forankring',14:'Rør og koblinger',15:'Plast',16:'Net',17:'Elhejs',19:'Telt',20:'Afspærring'};
const aliases={3:'spir stolpe stander soejle',4:'bom længdebom tvaerbom tværbom skråstiver diagonal',7:'platform gulv',11:'sparkebræt fodbræt',13:'anker muranker øjeskrue',14:'clamp beslag',17:'hejs motor'};
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/,/g,'.').replace(/ø/g,'o').replace(/æ/g,'ae');
export const groupOf=item=>parseInt(item.id);
export function searchMaterials(query=''){const parts=norm(query).split(/\s+/).filter(Boolean);return MATERIALS.filter(m=>parts.every(p=>norm(`${m.id} ${m.label} ${aliases[groupOf(m)]||''}`).includes(p)));}
export const freshTally=()=>({version:TALLY_VERSION,step:1,operation:'montage',rows:[],favorites:[],recent:[],approved:false,areas:[{id:'area-1',name:'Område 1',route:{method:'manual',ground:'',scaffold:0,stage:'ground',source:'truck',crane:0}}]});
export function validateTally(s){
 if(s?.version!==TALLY_VERSION||!Array.isArray(s.rows)||!Array.isArray(s.areas)||!s.areas.length)throw new Error('Ukendt eller ugyldig akkordseddel.');
 if(!['montage','demontage'].includes(s.operation)||s.areas.some(a=>!a||typeof a.id!=='string'||typeof a.name!=='string'||!a.route))throw new Error('Ugyldigt område.');
 if(new Set(s.areas.map(a=>a.id)).size!==s.areas.length)throw new Error('Områder har samme ID.');
 const ids=new Set();
 for(const row of s.rows){
  if(!row||ids.has(row.id)||row.id!==`${row.itemId}:${row.operation}`||!['montage','demontage'].includes(row.operation)||!row.allocations||typeof row.allocations!=='object')throw new Error('Dobbelt eller ugyldig materialelinje.');
  ids.add(row.id);materialPriceLine({...row,correctTentBasis:true});
  for(const [id,quantity] of Object.entries(row.allocations)){
   if(!s.areas.some(a=>a.id===id))throw new Error('Materiale henviser til et manglende område.');
   materialPriceLine({...row,quantity,correctTentBasis:true});
  }
 }
 return s;
}
export function setQuantity(s,itemId,operation,value){
 const input={itemId,operation,quantity:value};materialPriceLine({...input,correctTentBasis:true});
 let row=s.rows.find(r=>r.id===`${itemId}:${operation}`);
 if(!row){row={...input,id:`${itemId}:${operation}`,allocations:{}};s.rows.push(row);}
 row.quantity=value;
 if(s.areas.length===1)row.allocations={[s.areas[0].id]:value};
 s.recent=[itemId,...s.recent.filter(id=>id!==itemId)].slice(0,12);s.approved=false;
}
const sum=xs=>xs.reduce((n,v)=>n+Math.round(v*100),0)/100;
export function tallyResult(s){
 try{
  validateTally(s);if(Object.keys(s.draftErrors||{}).length)throw new Error(Object.values(s.draftErrors).join(' '));const lines=[],warnings=[],results={};
  for(const row of s.rows.filter(r=>Number(String(r.quantity).replace(',','.'))>0)){
   const total=materialPriceLine(row);
   const allocated=Object.values(row.allocations).reduce((n,q)=>n+Number(String(q).replace(',','.')),0);
   if(Math.abs(allocated-total.quantity)>1e-8)throw new Error(`${total.label}: fordel præcis ${total.quantity} ${units[total.unit]}; nu ${allocated}. Ingen automatisk ligelig fordeling.`);
   // Splitting rounded unit quantities must not manufacture billable units.
   const billed=Object.values(row.allocations).reduce((n,q)=>n+materialPriceLine({...row,quantity:q}).billedQuantity,0);
   if(Math.abs(billed-total.billedQuantity)>1e-8)throw new Error(`${total.label}: afrunding pr. område ændrer den samlede afregningsmængde. Afklar målegrundlaget.`);
   for(const area of s.areas){
    const q=row.allocations[area.id]??0;if(!Number(String(q).replace(',','.')))continue;
    const line=materialPriceLine({...row,quantity:q});let route;
    try{route=calculateTransport(area.route);}catch(e){route={valid:false,percent:null,reason:e.message};}
    if(line.tBase===0)route={...route,valid:true,percent:0,excluded:true};
    const rawTransport=route.valid&&!route.provisional?line.tBase*route.percent/100:null;
    lines.push({...line,rowId:row.id,areaId:area.id,areaName:area.name,route,rawTransport,
     transportAmount:rawTransport==null?null:moneyProduct(line.tBase,route.percent,.01),
     finalAmount:rawTransport==null?null:moneyProduct(line.workAmount+rawTransport)});
   }
  }
  if(!lines.length)throw new Error('Optæl mindst ét materiale.');
  for(const operation of ['montage','demontage']){
   const selected=lines.filter(l=>l.operation===operation);if(!selected.length)continue;
   const zones=selected.map((l,i)=>({id:`line-${i}`,side:l.areaName,length:1,...l.route}));
   const materials=selected.map((l,i)=>({itemId:l.id,quantity:l.quantity,zoneId:`line-${i}`,correctTentBasis:!!s.rows.find(r=>r.id===l.rowId)?.correctTentBasis}));
   const price=housePriceResult(zones,{mode:'precise',operation,materials});
   const minimum=runCalculator('minimum',{base:sum(selected.map(l=>l.fullBase)),demolition:operation==='demontage',other:sum(selected.map(l=>l.otherAmount))});
   results[operation]={...price,minimum};
   if(!price.complete||price.provisional)warnings.push(price.reason||'Vejledende sats kræver afklaring.');
  }
  const complete=warnings.length===0;
  return {version:TALLY_VERSION,priceVersion:PRICE_VERSION,status:complete?'beregnet':'AFKLARING_KRÆVES',complete,lines,results,warnings,
   workBase:sum(lines.map(l=>l.workAmount)),fullBase:sum(lines.map(l=>l.fullBase)),tBase:sum(lines.map(l=>l.tBase)),
   amount:complete?sum(Object.values(results).map(r=>r.workWithTransport)):null};
 }catch(e){return {version:TALLY_VERSION,complete:false,status:'AFKLARING_KRÆVES',reason:e.message,lines:[],results:{}};}
}
