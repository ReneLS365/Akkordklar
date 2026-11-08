/**
 * HP3 Provinsen: A6-A8, A18, A31 / pkt. 27, fig. C1-C6.
 * 2026-priser (+2,7 %) er vejledende; aftalt HP3 2025 er formelt grundlag.
 * Alle T-procenter er additive af fulde T-berettigede G, også ved demontage.
 * Geometrien er en dokumenteret fordelingsmodel, ikke en selvstændig aftaleregel.
 */
export const RULE_VERSION = 'HP3 Provinsen 2026 (+2,7 %) · Hvidbog 2025 · transportmotor 2.0.4 · 08.11.2026';
export const SOURCE_URL = './sources/HP3-Provinsen-2026.pdf';
export const TRANSPORT_REFS = 'HP3 A6–A8, A18, A31 · pkt. 27 · fig. C1–C6 · Hvidbog A6–A8, A18';
const EPS = 1e-7;
const MANUAL_WARNING = 'Uden hjul over 55 m: A6 nævner hjul, mens pkt. 27.1.c ikke gør. Afklar metode og betaling før afregning; A8 kræver særskilt akkordering ved specielle forhold. Hvidbog A8 beskriver APV ved ekstraordinære forhold.';
const DIRECT_REMAINDER_WARNING = 'A18: Direkte kranmontage af telt med efterfølgende resttransport kræver afklaring af det faktiske forløb. A18 fastsætter ikke et nyt opstartstillæg eller nye frigrænser for denne resttransport. Hvis kranen reelt afsætter materiel før særskilt bæring efter A6, bruges afsætningsstedet som målepunkt i stedet. Den viste pkt. 27-beregning er kun vejledende, indtil en samlet sats er aftalt.';
const mod = (x,p)=>((x%p)+p)%p;
export function toCm(value, label = 'Afstand') {
  if ((typeof value==='string'&&!value.trim()) || value === null || value === undefined || typeof value === 'boolean') throw new Error(`${label} mangler.`);
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  if (!Number.isFinite(n) || n < 0 || n > 10000) throw new Error(`${label} skal være mellem 0 og 10.000 meter.`);
  if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) throw new Error(`${label}: brug højst to decimaler.`);
  return Math.round(n * 100);
}
function agreedPercent(options={}) {
  if (!options.agreementConfirmed || !String(options.agreementNote||'').trim()) return null;
  const n = typeof options.agreedRate==='string'?Number(options.agreedRate.replace(',','.')):options.agreedRate;
  if ((typeof options.agreedRate==='string'&&!options.agreedRate.trim())||n==null||typeof n!=='number'||!Number.isFinite(n)||n<0||n>100000||Math.abs(n*100-Math.round(n*100))>1e-6) throw new Error('Den aftalte samlede transportsats skal være et tal mellem 0 og 100.000 med højst to decimaler.');
  return n;
}
function groundCm(cm, method, options={}) {
  if(method==='truck') {
    const extra=7*Math.max(0,Math.ceil((cm-15000)/5000));
    return {percent:7+extra,base:7,extra,valid:true};
  }
  if(!['manual','wheels'].includes(method))throw new Error('Vælg håndkraft, hjul eller truck.');
  if(cm===0&&options.handlingConfirmed!==true)return {percent:null,base:0,extra:0,valid:false,requiresClarification:true,clarificationCode:'A6_HANDLING_UNCONFIRMED',reason:'A6: 0 m dokumenterer ikke læsning, aflæsning eller berettiget materieltransport. Bekræft den faktiske håndtering, før 7 % kan beregnes.'};
  const extra=7*(Math.max(0,Math.ceil((Math.min(cm,5500)-2500)/1000))+Math.max(0,Math.ceil((cm-5500)/2000)));
  const previewPercent=7+extra;
  if(method==='manual'&&cm>5500) {
    const agreement=agreedPercent(options);
    if(agreement!==null)return {percent:agreement,base:7,extra:agreement-7,valid:true,agreed:true,agreementNote:options.agreementNote,warning:MANUAL_WARNING};
    if(options.indicative===true)return {percent:previewPercent,base:7,extra,valid:true,provisional:true,requiresClarification:true,warning:MANUAL_WARNING,previewPercent};
    return {percent:null,base:7,extra,valid:false,requiresClarification:true,reason:MANUAL_WARNING,warning:MANUAL_WARNING,previewPercent};
  }
  return {percent:previewPercent,base:7,extra,valid:true};
}
export function groundRate(meters, method='manual',options={}) {return groundCm(toCm(meters),method,options);}
export function scaffoldRate(groundMeters,scaffoldMeters) {
  const g=toCm(groundMeters,'Bil til hejs'),s=toCm(scaffoldMeters,'På stilladset'),includedCm=g<=2500?1500:1000;
  return {percent:7*Math.max(0,Math.ceil((s-includedCm)/1000)),included:includedCm/100};
}
export function transportLegs({ground,crane=0,source='truck'}) {
  const manualCm=toCm(ground,'Materialer til hejs'),craneCm=toCm(crane,'Kranstræk');
  if(!['truck','external','direct'].includes(source))throw new Error('Vælg stilladsbil, fremmed vognmand eller kran direkte til montage.');
  const countedCraneCm=source==='truck'?craneCm:0,totalCm=manualCm+countedCraneCm;
  if(totalCm>1000000)throw new Error('Den samlede afstand til hejs må højst være 10.000 m.');
  return {crane:craneCm/100,countedCrane:countedCraneCm/100,manualGround:manualCm/100,groundTotal:totalCm/100,source,craneExcluded:source!=='truck'&&craneCm>0};
}
function resultCm(config,legs,groundCmValue,scaffoldCmValue) {
  const {method='manual',stage='ground',special=false,excluded=false,reload=false}=config;
  if(!['ground','scaffold'].includes(stage))throw new Error('Vælg, hvor transporten sker.');
  if(!['manual','wheels','truck'].includes(method))throw new Error('Vælg håndkraft, hjul eller truck.');
  const activeScaffold=stage==='scaffold'?scaffoldCmValue:0;
  const included=groundCmValue<=2500?15:10,add=stage==='scaffold'?7*Math.max(0,Math.ceil((activeScaffold-included*100)/1000)):0;
  const common={...legs,stage,included,scaffold:stage==='scaffold'?scaffoldCmValue/100:0,reference:TRANSPORT_REFS,reloadPercent:reload?7:0,heightFactor:legs.source==='direct'&&config.directScope==='tent'?.5:1};
  if(excluded)return {...common,valid:true,percent:0,groundPercent:0,scaffoldPercent:0,excluded:true,reloadPercent:0};
  if(legs.source==='direct'&&config.directScope!=='tent')return {...common,valid:false,percent:null,reason:'A18 om kranmontage står under Teltarbejde. Ved anden kranmontage skal transport-/højdegrundlag afklares særskilt; appen overfører ikke automatisk teltreglen.'};
  const agreed=agreedPercent(config);
  if(special) {
    if(agreed!==null)return {...common,valid:true,percent:agreed,groundPercent:agreed,scaffoldPercent:0,reloadPercent:0,agreedIncludesReload:!!reload,agreed:true,agreementNote:config.agreementNote,warning:'Aftalt samlet T-sats efter A8; satsen indeholder de beskrevne transportled og eventuel omlæsning.'};
    return {...common,valid:false,percent:null,reason:'Særlige forhold efter A8 kræver særskilt akkordering. Indtast og dokumentér den aftalte samlede sats eller brug Særskilt aftale.'};
  }
  if(method==='truck'&&legs.countedCrane>0)throw new Error('Truck/teleskoplæsser og bilens aflæsningskran må ikke tælles på samme stræk. Opgør adskilte transportstræk særskilt.');
  const allDirect=legs.source==='direct'&&groundCmValue===0&&activeScaffold===0;
  if(legs.source==='direct'&&!allDirect) {
    if(agreed!==null)return {...common,valid:true,percent:agreed,groundPercent:null,scaffoldPercent:null,reloadPercent:0,agreedIncludesReload:!!reload,agreed:true,agreementNote:config.agreementNote,warning:'A18: Aftalt samlet T-sats for det beskrevne resttransportforløb; eventuel omlæsning er indeholdt. Kranens direkte montageafstand er ikke transportgrundlag.'};
    const preview=groundCm(groundCmValue,method,{...config,indicative:true,handlingConfirmed:true}),previewPercent=preview.percent+add+(reload?7:0);
    const warning=DIRECT_REMAINDER_WARNING+(preview.warning?` ${preview.warning}`:'');
    return {...common,valid:config.indicative===true,percent:config.indicative===true?previewPercent:null,
      previewPercent,groundPercent:preview.percent,scaffoldPercent:add,provisional:config.indicative===true,
      requiresClarification:true,clarificationCode:'A18_REMAINING_TRANSPORT',warning,reason:warning};
  }
  const b=allDirect?{valid:true,percent:0,base:0,extra:0}:groundCm(groundCmValue,method,{...config,handlingConfirmed:config.handlingConfirmed===true||activeScaffold>0});
  if(!b.valid)return {...common,...b,groundPercent:null,scaffoldPercent:add,...(b.previewPercent!=null?{previewPercent:b.previewPercent+add+(reload?7:0)}:{})};
  // An agreedRate is the documented TOTAL for this route, not a rate to add to.
  const total=b.agreed?b.percent:b.percent+add+(reload?7:0);
  return {...common,...b,percent:total,groundPercent:b.percent,scaffoldPercent:b.agreed?0:add,
    ...(b.agreed?{reloadPercent:0,agreedIncludesReload:!!reload}:{}),
    ...(allDirect?{warning:'A18: Kranens montage-/demontagestræk er uden T. H halveres for kranmonterede dele. Eventuel særskilt resterende bæring skal opgøres.'}:{}),
    ...(legs.source==='external'?{externalTime:true,externalNote:'A6 / A18: indhejsning afregnes med forbrugt tid, dog ikke teltmontage. Ekstern kranførers timer holdes uden for akkorden jf. PU 06-06-2016.'}:{})};
}
export function calculateTransport(config) {
  // Validate only the active leg; retain the draft value for switching back.
  const legs=transportLegs(config),s=config.stage==='scaffold'?toCm(config.scaffold,'Afstand på stilladset'):0;
  return resultCm(config,legs,Math.round(legs.groundTotal*100),s);
}
export function perimeterPoint(position,length,depth) {
  const p=2*(length+depth),s=mod(position,p);
  if(s<=length)return {x:s,y:depth};
  if(s<=length+depth)return {x:length,y:depth-(s-length)};
  if(s<=2*length+depth)return {x:length-(s-length-depth),y:0};
  return {x:0,y:s-(2*length+depth)};
}
function routeCm(s,origin,p,route) {
  const cw=mod(s-origin,p),ccw=mod(origin-s,p);
  if(route==='cw')return cw;
  if(route==='ccw')return ccw;
  if(route==='both')return Math.min(cw,ccw);
  throw new Error('Vælg én eller begge veje rundt.');
}
export function routeDistance({position,origin,perimeter,route='both'}) {
  const p=toCm(perimeter,'Omkreds');if(!p)throw new Error('Omkredsen skal være større end 0.');
  return routeCm(toCm(position),toCm(origin),p,route)/100;
}
/** Actual ordered perimeter positions, preserving half-centimetre zone midpoints. */
export function routePositions({position,origin,length,depth,route='both'}) {
  const l=toCm(length),d=toCm(depth),p=2*(l+d),o=toCm(origin),target=Number(position)*100;
  if(!p||o>p||!Number.isFinite(target)||target<0||target>p)throw new Error('Ugyldigt punkt på transportlinjen.');
  const cw=mod(target-o,p),ccw=mod(o-target,p),direction=route==='both'?(cw<=ccw?'cw':'ccw'):route;
  if(!['cw','ccw'].includes(direction))throw new Error('Ugyldig ruteretning.');
  const travel=direction==='cw'?cw:ccw,corners=[0,l,l+d,2*l+d];
  const ordered=corners.map(pos=>({pos,distance:direction==='cw'?mod(pos-o,p):mod(o-pos,p)})).filter(v=>v.distance>0&&v.distance<travel).sort((a,b)=>a.distance-b.distance);
  return {positions:[o,...ordered.map(v=>v.pos),target].map(v=>v/100),direction,distance:travel/100};
}
function barriersCm(values,p) {
  if(!Array.isArray(values))throw new Error('Spærringer skal være en liste.');
  const out=[];
  for(const v of values) {
    if(v==null||typeof v==='boolean')throw new Error('Ugyldig spærring.');
    const point=typeof v!=='object',a=toCm(point?v:v.start,'Spærring start'),b=toCm(point?v:v.end,'Spærring slut');
    if(a>p||b>p)throw new Error('En spærring ligger uden for husets transportlinje.');
    const start=mod(a,p),end=mod(b,p);
    if(point||a===b)out.push({start,end:start,point:true});
    else if(start<end)out.push({start,end,point:false});
    else {out.push({start,end:p,point:false});if(end>0)out.push({start:0,end,point:false});}
  }
  return out;
}
function insideBlocked(s,blocks) {return blocks.some(b=>!b.point&&s>b.start+EPS&&s<b.end-EPS);}
function rayLimit(o,direction,p,blocks) {
  if(insideBlocked(o,blocks))return 0;
  let limit=p;
  for(const b of blocks) {
    if(b.point) {
      const delta=direction==='cw'?mod(b.start-o,p):mod(o-b.start,p);
      // A point cut at an origin closes both routes from that origin.
      limit=Math.min(limit,delta);
    } else if(direction==='cw') {
      if(o>=b.start-EPS&&o<b.end-EPS)return 0;
      limit=Math.min(limit,mod(b.start-o,p));
    } else {
      if(o>b.start+EPS&&o<=b.end+EPS)return 0;
      limit=Math.min(limit,mod(o-b.end,p));
    }
  }
  return limit;
}
/** Ray pieces on [0,p]. Each has routeDistanceCm = slope*s + intercept. */
function raysFor(hoist,p,blocks) {
  const out=[],o=hoist.positionCm;
  for(const direction of ['cw','ccw']) {
    if(hoist.route!=='both'&&hoist.route!==direction)continue;
    const limit=rayLimit(o,direction,p,blocks);if(limit<=EPS)continue;
    const slope=direction==='cw'?1:-1;
    for(const shift of [-p,0,p]) {
      const start=o+shift,end=start+slope*limit,lo=Math.max(0,Math.min(start,end)),hi=Math.min(p,Math.max(start,end));
      if(hi-lo<=EPS)continue;
      const intercept=-slope*start;
      out.push({lo,hi,slope,intercept,direction,hoist,costIntercept:hoist.legs.groundTotal*100+intercept});
    }
  }
  return out;
}
function groundThresholds(max,method) {
  const out=method==='truck'?[15000]:[2500,3500,4500,5500],step=method==='truck'?5000:2000,start=method==='truck'?20000:7500;
  for(let t=start;t<=max;t+=step)out.push(t);
  return out;
}
/**
 * Exact continuous zone model, split BEFORE selecting a representative point.
 * hoists: [{id,name,position,ground,crane,source,method?,route?}] in perimeter m.
 * barriers: [{start,end}] closed clockwise arcs, or numbers for point cuts.
 * Candidates use shortest measured total route. Intersections, origins,
 * corners, barriers and EVERY candidate's percentage boundary are split.
 * No fixed zone count. No midpoint approximation across a rate boundary.
 */
export function houseZones(config) {
  const l=toCm(config.length,'Forside'),d=toCm(config.depth,'Gavl');
  if(!l||!d)throw new Error('Begge sider skal være større end 0 meter.');
  if(l>50000||d>50000)throw new Error('Hver side må højst være 500 m. Brug egne afstande ved større ruter.');
  const p=2*(l+d),stage=config.stage??'ground',method=config.method??'manual',route=config.route??'both';
  if(!['ground','scaffold'].includes(stage))throw new Error('Vælg transport på jorden eller på stilladset.');
  if(!['manual','wheels','truck'].includes(method))throw new Error('Vælg håndkraft, hjul eller truck.');
  if(!['both','cw','ccw'].includes(route))throw new Error('Vælg én eller begge veje rundt.');
  const blocks=barriersCm(config.barriers??[],p),entry=toCm(config.entry??0,'Adgang fra venstre');
  if(entry>l&&!config.hoists?.length)throw new Error('Adgangen skal ligge på forsiden.');
  if(config.hoists!=null&&!Array.isArray(config.hoists))throw new Error('Hejsesteder skal være en liste.');
  const raw=config.hoists?.length?config.hoists:[{id:'default',name:'Hejs / adgang',position:entry/100}];
  const ids=new Set();
  const hoists=raw.map((h,index)=>{
    if(!h||typeof h!=='object')throw new Error('Ugyldigt hejsested.');
    const positionCm=toCm(h.position,'Hejsestedets placering');if(positionCm>=p)throw new Error('Hejsestedet skal ligge på husets transportlinje før omkredsens slutpunkt.');
    const id=String(h.id??`hejs-${index+1}`);if(ids.has(id))throw new Error('Hejsesteder skal have forskellige id’er.');ids.add(id);
    const merged={...config,...h,stage,method:h.method??method,route:h.route??route},legs=transportLegs(merged);
    if(!['both','cw','ccw'].includes(merged.route))throw new Error('Vælg en gyldig rute for hvert hejsested.');
    if(!['manual','wheels','truck'].includes(merged.method))throw new Error('Vælg et gyldigt transportmiddel for hvert hejsested.');
    if(merged.method==='truck'&&legs.countedCrane>0)throw new Error('Truck og bilens kran må ikke afregne samme transportstræk.');
    if(insideBlocked(positionCm,blocks))throw new Error('Et hejsested ligger inde i en spærret transportstrækning.');
    return {...merged,id,name:String(h.name??`Hejs ${index+1}`),positionCm,legs};
  });
  const rays=hoists.flatMap(h=>raysFor(h,p,blocks)),breaks=[0,l,l+d,2*l+d,p,...hoists.map(h=>h.positionCm)];
  for(const b of blocks)breaks.push(b.start,b.end);
  for(const ray of rays) {
    breaks.push(ray.lo,ray.hi);
    const thresholds=stage==='ground'?groundThresholds(ray.hoist.legs.groundTotal*100+p,ray.hoist.method).map(t=>t-ray.hoist.legs.groundTotal*100):[];
    if(stage==='scaffold')for(let t=ray.hoist.legs.groundTotal<=25?1500:1000;t<=p;t+=1000)thresholds.push(t);
    for(const delta of thresholds) {
      const s=(delta-ray.intercept)/ray.slope;
      if(s>ray.lo+EPS&&s<ray.hi-EPS)breaks.push(s);
    }
  }
  for(let i=0;i<rays.length;i++)for(let j=i+1;j<rays.length;j++) {
    const a=rays[i],b=rays[j];if(a.slope===b.slope)continue;
    const s=(b.costIntercept-a.costIntercept)/(a.slope-b.slope);
    if(s>Math.max(a.lo,b.lo)+EPS&&s<Math.min(a.hi,b.hi)-EPS)breaks.push(s);
  }
  const sorted=[...new Set(breaks.map(x=>Math.round(x*1e6)/1e6))].sort((a,b)=>a-b);
  const edges=[{end:l,name:'Forside',start:0},{end:l+d,name:'Højre gavl',start:l},{end:2*l+d,name:'Bagside',start:l+d},{end:p,name:'Venstre gavl',start:2*l+d}],zones=[];
  for(let i=0;i<sorted.length-1;i++) {
    const a=sorted[i],b=sorted[i+1];if(b-a<=EPS)continue;
    const m=(a+b)/2,edge=edges.find(e=>m<e.end+EPS);
    const candidates=rays.filter(r=>m>r.lo-EPS&&m<r.hi+EPS).sort((x,y)=>(x.slope*m+x.costIntercept)-(y.slope*m+y.costIntercept)||hoists.indexOf(x.hoist)-hoists.indexOf(y.hoist)||x.direction.localeCompare(y.direction));
    const selected=insideBlocked(m,blocks)?null:candidates[0];
    const geom={id:`z-${a}-${b}`,index:zones.length+1,side:edge.name,start:a/100,end:b/100,from:(a-edge.start)/100,to:(b-edge.start)/100,length:(b-a)/100,samplePosition:m/100};
    if(!selected) {zones.push({...geom,valid:false,percent:null,unreachable:true,reason:'Området kan ikke nås fra de angivne hejsesteder på en åben transportvej. Ret spærringer/hejs eller opgør en særskilt faktisk rute.',distanceMin:null,distanceMax:null,groundMin:null,groundMax:null,sampleRoute:0});continue;}
    const h=selected.hoist,delta=selected.slope*m+selected.intercept,da=selected.slope*a+selected.intercept,db=selected.slope*b+selected.intercept;
    const min=Math.min(da,db)/100,max=Math.max(da,db)/100,g=h.legs.groundTotal*100;
    const actualGround=stage==='ground'?g+delta:g,actualScaffold=stage==='scaffold'?delta:0;
    const actualLegs={...h.legs,manualGround:h.legs.manualGround+(stage==='ground'?delta/100:0),groundTotal:actualGround/100};
    const result=resultCm(h,actualLegs,actualGround,actualScaffold);
    const override=config.distanceOverrides?.[geom.id];
    let manualResult={};
    if(override!=null) {
      if(typeof override!=='object'||Array.isArray(override))throw new Error('En manuelt rettet zoneafstand er ugyldig.');
      const fixedLegs=transportLegs({...h,ground:0,crane:override.crane??h.crane??0,source:override.source??h.source});
      const manualCm=override.ground!=null?toCm(override.ground,'Rettet afstand til hejs'):actualLegs.manualGround*100;
      const revisedGround=manualCm+fixedLegs.countedCrane*100;
      if(revisedGround>1000000)throw new Error('Den rettede samlede afstand til hejs må højst være 10.000 m.');
      const revisedScaffold=stage==='scaffold'?(override.scaffold!=null?toCm(override.scaffold,'Rettet afstand på stilladset'):actualScaffold):0;
      const revisedLegs={...fixedLegs,manualGround:manualCm/100,groundTotal:revisedGround/100};
      manualResult={...resultCm(h,revisedLegs,revisedGround,revisedScaffold),manualDistance:true,distanceOverride:{...override},geometryNote:'Afstand rettet manuelt for denne zone. Skitsen viser husets geometri; de rettede mål bruges i regnestykket.'};
    }
    zones.push({...geom,...result,distanceMin:min,distanceMax:max,sampleRoute:delta/100,
      groundMin:stage==='ground'?g/100+min:g/100,groundMax:stage==='ground'?g/100+max:g/100,
      hoistId:h.id,hoistName:h.name,originPosition:h.positionCm/100,routeDirection:selected.direction,...manualResult});
  }
  const first=hoists[0],legs=first.legs;
  return {...legs,perimeter:p/100,zones,hoists:hoists.map(h=>({id:h.id,name:h.name,position:h.positionCm/100,groundTotal:h.legs.groundTotal})),
    included:legs.groundTotal<=25?15:10,maxRoute:p/100,valid:zones.every(z=>z.valid),provisional:zones.some(z=>z.provisional),
    model:'Rektangulær transportlinje; korteste åbne målte rute mellem de angivne hejsesteder og områder. Meterfordeling forudsætter ens G pr. meter.'};
}
/** Weighted full T bases; exact integer arithmetic in øre and hundredth-%.
 * Round only the aggregate transport amount, never each material's % first.
 */
export function weightedResult(rows) {
  if(!Array.isArray(rows)||!rows.length)return {complete:false,percent:null,amount:null,base:0};
  let baseCents=0,weighted=0n,complete=true,provisional=false;
  for(const row of rows) {
    const raw=row?.base,val=typeof raw==='string'?Number(raw.replace(',','.')):raw;
    if((typeof raw==='string'&&!raw.trim())||raw==null||typeof raw==='boolean'||!Number.isFinite(val)||val<0||val>1e9||Math.abs(val*100-Math.round(val*100))>1e-5){complete=false;continue;}
    const cents=Math.round(val*100),percent=row.percent;
    const rateValid=typeof percent==='number'&&Number.isFinite(percent)&&percent>=0&&percent<=100000&&Math.abs(percent*100-Math.round(percent*100))<1e-5;
    if((!row.valid||!rateValid)&&cents>0)complete=false;
    baseCents+=cents;if(!Number.isSafeInteger(baseCents))complete=false;
    if(row.valid&&rateValid)weighted+=BigInt(cents)*BigInt(Math.round(percent*100));
    if(row.provisional&&cents>0)provisional=true;
  }
  if(!complete||baseCents<=0)return {complete:false,percent:null,amount:null,base:baseCents/100,provisional};
  const rounded=(weighted+5000n)/10000n;
  if(rounded>BigInt(Number.MAX_SAFE_INTEGER))return {complete:false,percent:null,amount:null,base:baseCents/100,reason:'Beløbet overstiger beregnerens præcisionsgrænse.'};
  return {complete:true,percent:Number(weighted)/baseCents/100,amount:Number(rounded)/100,base:baseCents/100,provisional};
}
export function uniformEstimate(zones) {
  if(!zones.length||zones.some(z=>!z.valid))return null;
  const length=zones.reduce((n,z)=>n+z.length,0);
  return length>0?zones.reduce((n,z)=>n+z.length*z.percent,0)/length:null;
}
