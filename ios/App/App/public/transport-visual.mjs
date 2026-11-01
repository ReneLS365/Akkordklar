import {perimeterPoint,routePositions,transportLegs} from './engine.mjs';

const f=n=>new Intl.NumberFormat('da-DK',{maximumFractionDigits:2}).format(n);
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette=['#4d8d7c','#709b5d','#baa343','#ce7c3f','#b9543a','#964844','#754b55','#534757'];
const color=p=>p==null?'#9c8b78':palette[Math.min(Math.max(Math.round(p/7)-1,0),palette.length-1)];
const ink='var(--diagram-ink,#203337)',bg='var(--diagram-bg,#ffffff)',muted='var(--diagram-muted,#667373)',carryColor='var(--diagram-carry,#397b68)',craneColor='var(--diagram-crane,#c64a27)';
const rateText=r=>r.percent==null?(r.previewPercent!=null?`≈${f(r.previewPercent)}%`:'?'):`${r.provisional?'≈':''}${f(r.percent)}%`;
const sourceName=r=>r.source==='external'?'FREMMED VOGNMAND':r.source==='direct'?'KRAN TIL TELTMONTAGE':'STILLADSBIL';
const craneNote=r=>r.source==='external'?'Fremmed vognmand · uden for T-målet':r.source==='direct'?'Teltmontage A18 · uden T for kranstrækket':'Egen kran ved aflæsning · med i T-målet';
const vehicle=(x,y)=>`<g transform="translate(${x-22} ${y})"><rect width="32" height="22" rx="2" fill="${ink}"/><path d="M32 5h10l3 4 4 5v8H32z" fill="${carryColor}"/><path d="M35 8h6l4 6H35z" fill="${bg}"/><circle cx="9" cy="24" r="4" fill="${ink}"/><circle cx="40" cy="24" r="4" fill="${ink}"/></g>`;
function defs(id){return `<defs><marker id="${id}-walk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5z" fill="${carryColor}"/></marker><marker id="${id}-crane" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5z" fill="${craneColor}"/></marker><marker id="${id}-route" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5z" fill="${ink}"/></marker></defs>`;}
const text=(x,y,contents,classes='',attrs='')=>`<text x="${x}" y="${y}" class="${classes}" style="fill:${ink}" ${attrs}>${contents}</text>`;

/** Prefer the engine's selected-route snapshot. Legacy zones remain readable. */
export function zoneTrace(config,zone){
  if(zone.unreachable)return {...zone,stage:config.stage,source:config.source,crane:0,manualGround:0,groundTotal:0,scaffold:0};
  if(Number.isFinite(zone.groundTotal))return {...zone,stage:zone.stage||config.stage,source:zone.source||config.source,special:config.special};
  const hoist=config.hoists?.find(h=>h.id===zone.hoistId),legs=transportLegs({...config,...hoist});
  const delta=zone.sampleRoute||0,carry=legs.manualGround+(config.stage==='ground'?delta:0);
  return {...legs,manualGround:carry,groundTotal:legs.countedCrane+carry,scaffold:config.stage==='scaffold'?delta:0,stage:config.stage,percent:zone.percent,previewPercent:zone.previewPercent,provisional:zone.provisional,warning:zone.warning,groundPercent:zone.groundPercent,scaffoldPercent:zone.scaffoldPercent,reloadPercent:zone.reloadPercent||0,included:legs.groundTotal<=25?15:10,excluded:zone.excluded,special:config.special};
}
export function traceMarkup(r,{sample=false}={}){
  if(r.unreachable)return `<div class="transport-trace"><p class="trace-formula"><b>Ingen åben rute til denne zone.</b></p><p class="trace-sample">${e(r.reason||'Ret spærringer og hejsesteder, eller angiv den faktiske rute manuelt.')}</p></div>`;
  const crane=r.crane||0,carry=r.manualGround||0,scaffold=r.scaffold||0,excluded=r.source==='external'||r.source==='direct';
  const total=r.percent??r.previewPercent;
  const groundFormula=r.source==='direct'&&carry===0&&scaffold===0?'Kun kran til teltmontage. Kranstrækket giver ikke transporttillæg efter A18.':`${crane>0?(excluded?`Kranens ${f(crane)} m holdes uden for T-målet. `:`${f(crane)} m kran + `):''}${f(carry)} m på jorden = <b>${f(r.groundTotal||0)} m til hejs</b>${r.groundPercent!=null?` → <b>${f(r.groundPercent)} %</b>`:''}.`;
  return `<div class="transport-trace"><div class="trace-kicker">${sample?'RUTEN TIL ET EKSEMPELPUNKT I DEN VALGTE ZONE':'HELE TRANSPORTFORLØBET'}</div><ol class="trace-steps">${crane>0?`<li class="trace-crane"><small>${r.source==='direct'?'Kran → teltmontage':'Bil → materialer'}</small><strong>${f(crane)} m</strong><span>${craneNote(r)}</span></li>`:''}<li><small>${crane>0||r.source==='external'?'Materialer':'Bil'} → hejs</small><strong>${f(carry)} m</strong><span>Videre på jorden</span></li>${r.stage==='scaffold'?`<li><small>Hejs → montage</small><strong>${f(scaffold)} m</strong><span>Transport på stilladset</span></li>`:''}</ol><p class="trace-formula">${groundFormula}${r.stage==='scaffold'&&r.scaffoldPercent!=null?`<br>${f(scaffold)} m på stilladset (${f(r.included)} m uden ekstra stilladstillæg) → <b>+${f(r.scaffoldPercent)} %</b>.`:''}${r.reloadPercent?`<br>Omlæsning på arbejdsstedet A31 → <b>+${f(r.reloadPercent)} %</b>.`:''}${r.agreedIncludesReload?'<br>Omlæsning indgår i den samlede aftalte sats; intet ekstra tillæg.':''}${total!=null?`<br>Samlet <b>${r.provisional||r.percent==null?'vejledende ':''}${f(total)} %</b>.`:''}</p>${r.warning||r.reason?`<p class="trace-sample">${e(r.warning||r.reason)}</p>`:''}${sample?'<p class="trace-sample">Det markerede spor følger den valgte åbne rute. Eksempelpunktet ligger inden for én præcist afgrænset satszone. De konkrete materialer opgøres i zonen.</p>':''}</div>`;
}

export function houseMap(config,result,selected){
  const l=Number(config.length),d=Number(config.depth),perimeter=2*(l+d);
  const scale=Math.min(275/l,160/d),w=l*scale,h=d*scale,x=(500-w)/2,y=125-h/2;
  const point=s=>{const v=perimeterPoint(Number(s)||0,l,d);return {x:x+v.x*scale,y:y+v.y*scale};};
  selected??=result.zones?.[0];
  if(!selected)return '<p class="hint">Der er ingen transportzoner at vise.</p>';
  const hoists=result.hoists?.length?result.hoists:config.hoists?.length?config.hoists:[{id:'entry',position:Number(config.entry)||0,name:config.stage==='scaffold'?'Hejs':'Adgang'}];
  const origin=Number(selected.originPosition??hoists.find(h=>h.id===selected.hoistId)?.position??config.entry)||0;
  const o=point(origin),target=point(selected.samplePosition),trace=zoneTrace(config,selected),crane=trace.crane||0,roadY=345;
  const direction=config.craneDirection||'left',truckX=Math.max(72,Math.min(428,o.x+(crane>0?(direction==='right'?-75:75):0))),sourceY=roadY-13;
  let routePoints='';
  if(!selected.unreachable&&selected.reachable!==false&&selected.originPosition!==null){
    try{routePoints=routePositions({position:selected.samplePosition,origin,length:l,depth:d,route:selected.routeDirection||config.route||'both'}).positions.map(point).map(p=>`${p.x},${p.y}`).join(' ');}catch{/* An unreachable zone has no route; don't draw a fictitious one. */}
  }
  const bands=(result.zones||[]).map(z=>{
    const a=point(z.start),b=point(z.end),m=point((z.start+z.end)/2),dx=z.side==='Højre gavl'?23:z.side==='Venstre gavl'?-23:0,dy=z.side==='Forside'?23:z.side==='Bagside'?-16:3;
    const rotate=/gavl/.test(z.side)?`transform="rotate(-90 ${m.x+dx} ${m.y+dy})"`:'';
    const label=rateText(z),description=z.percent==null?z.previewPercent!=null?`vejledende ${f(z.previewPercent)} procent, kræver afklaring`:'kan ikke fastsættes':`${z.provisional?'vejledende ':''}${f(z.percent)} procent`;
    return `<g class="zone-segment" tabindex="0" role="button" aria-label="Zone ${z.index}, ${e(z.side)}, ${e(description)}" data-zone="${z.index}"><title>Zone ${z.index}: ${e(z.side)}, ${f(z.from)}–${f(z.to)} m. ${e(description)}${z.hoistName?` via ${e(z.hoistName)}`:''}</title><path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="${color(z.percent??z.previewPercent)}" stroke-width="${z.index===selected.index?11:8}" fill="none" ${z.provisional||z.percent==null?'stroke-dasharray="5 2"':''}/><path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="transparent" stroke-width="23" fill="none"/>${z.length*scale>Math.max(45,label.length*7)?text(m.x+dx,m.y+dy,label,'zone-label',`text-anchor="middle" ${rotate}`):''}</g>`;
  }).join('');
  const barrierMarkup=(config.barriers||[]).map((barrier,i)=>{
    const start=typeof barrier==='number'?barrier:Number(barrier.start??barrier.position),end=typeof barrier==='number'?barrier:Number(barrier.end??barrier.start??barrier.position);
    if(!Number.isFinite(start)||!Number.isFinite(end))return '';
    const a=point(start),delta=((end-start)%perimeter+perimeter)%perimeter;
    if(delta<0.001)return `<g class="map-barrier"><title>Spærring ${i+1}, ${f(start)} m på transportlinjen</title><circle cx="${a.x}" cy="${a.y}" r="9" fill="${bg}" stroke="#cf4747" stroke-width="2"/><path d="M${a.x-4} ${a.y-4}l8 8m0-8-8 8" stroke="#cf4747" stroke-width="2.5"/></g>`;
    let positions;try{positions=routePositions({position:end%perimeter,origin:start%perimeter,length:l,depth:d,route:'cw'}).positions;}catch{return '';}
    const points=positions.map(point).map(p=>`${p.x},${p.y}`).join(' ');
    return `<g class="map-barrier"><title>Spærret fra ${f(start)} til ${f(end)} m med uret på transportlinjen</title><polyline points="${points}" fill="none" stroke="${bg}" stroke-width="15"/><polyline points="${points}" fill="none" stroke="#cf4747" stroke-width="10" stroke-dasharray="3 4"/></g>`;
  }).join('');
  const hoistMarkup=hoists.map((hoist,i)=>{
    const p=point(hoist.position),isSelected=selected.hoistId!=null?hoist.id===selected.hoistId:Math.abs(Number(hoist.position)-origin)<0.001;
    const sidePos=((Number(hoist.position)%perimeter)+perimeter)%perimeter;
    const dx=sidePos>l&&sidePos<l+d?18:sidePos>2*l+d?-18:0,dy=sidePos<=l?33:sidePos<=l+d?4:sidePos<=2*l+d?-18:4;
    return `<g class="map-hoist"><title>${e(hoist.name||`Hejs ${i+1}`)}: ${f(Number(hoist.position))} m fra forreste venstre hjørne med uret${isSelected?', valgt rute':''}</title><circle cx="${p.x}" cy="${p.y}" r="${isSelected?7:5}" fill="${isSelected?ink:bg}" stroke="${isSelected?bg:ink}" stroke-width="2"/>${text(p.x+dx,p.y+dy,hoists.length>1?`H${i+1}`:config.stage==='scaffold'?'HEJS':'ADGANG','side-label','text-anchor="middle"')}</g>`;
  }).join('');
  // Input distances are not drawn to scale. Keep every approach segment outside
  // the house; the final short arrow enters perpendicular to the selected edge.
  const s=((origin%perimeter)+perimeter)%perimeter,frontY=y+h;
  const depot={x:o.x,y:sourceY-5};
  const exteriorLeft=x-36,exteriorRight=x+w+36,exteriorBack=y-18;
  let approachPoints;
  if(s<=l){
    approachPoints=[depot,{x:o.x,y:o.y+13}];
  }else if(s<l+d){
    approachPoints=[depot,{x:exteriorRight,y:depot.y},{x:exteriorRight,y:o.y},{x:o.x+13,y:o.y}];
  }else if(s<=2*l+d){
    const exteriorX=o.x>=250?exteriorRight:exteriorLeft;
    approachPoints=[depot,{x:exteriorX,y:depot.y},{x:exteriorX,y:exteriorBack},{x:o.x,y:exteriorBack},{x:o.x,y:o.y-13}];
  }else{
    approachPoints=[depot,{x:exteriorLeft,y:depot.y},{x:exteriorLeft,y:o.y},{x:o.x-13,y:o.y}];
  }
  const approach=approachPoints.map(p=>`${p.x},${p.y}`).join(' ');
  const approachLabelY=Math.max(frontY+50,265);
  return `<svg class="house-svg house-svg-chain" viewBox="0 0 500 411" role="group" aria-label="Transport fra bil til materialer, via valgt hejs og den åbne rute til zone ${selected.index}">${defs('house')}<defs><pattern id="roof-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="var(--diagram-roof,#f1f4ed)"/><line y2="7" stroke="var(--diagram-line,#dce2d5)" stroke-width="1"/></pattern></defs><rect x="${x+11}" y="${y+11}" width="${Math.max(w-22,1)}" height="${Math.max(h-22,1)}" fill="url(#roof-hatch)" stroke="var(--diagram-line,#d5ddd0)" rx="2"/><path d="M${x+11} ${y+h/2}h${Math.max(w-22,1)}" stroke="var(--diagram-line,#d4dcd0)"/>${text(250,y+h/2-8,'HUSET','house-label','text-anchor="middle"')}${text(250,y+h/2+13,'SET OVENFRA','side-label','text-anchor="middle"')}${text(250,y-28,'BAGSIDE','side-label','text-anchor="middle"')}${text(x-40,y+h/2,`${f(d)} m`,'dimension',`text-anchor="middle" transform="rotate(-90 ${x-40} ${y+h/2})"`)}${text(250,y-43,`${f(l)} m`,'dimension','text-anchor="middle"')}${bands}${barrierMarkup}${routePoints?`<polyline points="${routePoints}" fill="none" stroke="${bg}" stroke-width="5" pointer-events="none"/><polyline points="${routePoints}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-dasharray="5 3" marker-end="url(#house-route)" pointer-events="none"/>`:''}<circle cx="${target.x}" cy="${target.y}" r="5" fill="${craneColor}" stroke="${bg}" stroke-width="2" pointer-events="none"/>${hoistMarkup}<rect x="25" y="${roadY}" width="450" height="40" rx="5" fill="var(--diagram-road,#e9ede4)"/><path d="M32 ${roadY+20}h436" stroke="var(--diagram-line,#c8d1c0)" stroke-dasharray="10 9"/>${vehicle(truckX,roadY+3)}${text(truckX,roadY+50,sourceName(trace),'side-label','text-anchor="middle"')}${!selected.unreachable?`<polyline class="map-approach" points="${approach}" fill="none" stroke="${carryColor}" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#house-walk)"><title>Indtastet vej fra materialer til ${config.stage==='scaffold'?'hejs':'adgang'}. Skitsen er ikke målfast.</title></polyline>`:''}${text(250,approachLabelY,selected.manualDistance?'MÅL RETTET MANUELT':`${f(Math.max(0,Number(trace.manualGround||0)-(config.stage==='ground'?(selected.sampleRoute||0):0)))} m frem til ${config.stage==='scaffold'?'hejs':'adgang'}`,'leg-label','text-anchor="middle"')}${crane>0?`<path d="M${truckX} ${roadY+1}V${sourceY}H${o.x+(direction==='right'?-8:8)}" fill="none" stroke="${craneColor}" stroke-width="2.5" marker-end="url(#house-crane)"/>${text((truckX+o.x)/2,sourceY-12,`Kran ${f(crane)} m`,'leg-label crane-label','text-anchor="middle"')}<rect x="${o.x-5}" y="${sourceY-5}" width="10" height="10" fill="${craneColor}" stroke="${bg}" stroke-width="1.5"/>`:''}${text(26,403,`SKITSE · IKKE MÅLFAST${config.barriers?.length?' · RØDT = SPÆRRET':''}`,'side-label')}${hoists.length>1?text(474,403,`${hoists.length} HEJSESTEDER`,'side-label','text-anchor="end"'):''}</svg>`;
}

export function lineMap(row,r){
  const id=`line-${String(row.id||'quick').replace(/[^a-z0-9-]/gi,'')}`;
  const crane=r.crane||0,left=(row.craneDirection||'left')==='left';
  const depotX=left?155:345,truckX=crane>0?(left?320:180):depotX;
  const y=200,hejsY=65,montageX=left?345:155;
  return `<div class="line-map"><svg viewBox="0 0 500 260" role="group" aria-label="Bil til materialer, videre til hejs og eventuelt langs stilladset">${defs(id)}<path d="M90 ${hejsY}H410" stroke="var(--diagram-line,#d9e0d4)" stroke-width="10"/>${text(400,hejsY-24,'STILLADS','side-label','text-anchor="end"')}${vehicle(truckX,y)}${crane>0?`<path d="M${truckX} ${y-8}H${depotX+(left?8:-8)}" stroke="${craneColor}" stroke-width="2.5" marker-end="url(#${id}-crane)"/>${text((truckX+depotX)/2,y-20,`${f(crane)} m kran${r.source==='direct'||r.source==='external'?' · uden T':''}`,'leg-label crane-label','text-anchor="middle"')}<rect x="${depotX-5}" y="${y-13}" width="10" height="10" fill="${craneColor}"/>${text(depotX-10,y+12,'MATERIALER','side-label','text-anchor="end"')}`:''}<path d="M${depotX} ${y-19}V${hejsY+12}" stroke="${carryColor}" stroke-width="2.5" stroke-dasharray="6 4" marker-end="url(#${id}-walk)"/>${text(depotX+11,130,`${f(r.manualGround||0)} m videre`,'leg-label')}<circle cx="${depotX}" cy="${hejsY}" r="6" fill="${ink}"/>${text(depotX,hejsY-17,'HEJS','side-label','text-anchor="middle"')}${row.stage==='scaffold'?`<path d="M${depotX+(left?10:-10)} ${hejsY}H${montageX+(left?-8:8)}" stroke="${ink}" stroke-width="2.5" stroke-dasharray="5 3" marker-end="url(#${id}-route)"/>${text((depotX+montageX)/2,hejsY+23,`${f(r.scaffold||0)} m på stilladset`,'leg-label','text-anchor="middle"')}<circle cx="${montageX}" cy="${hejsY}" r="5" fill="${craneColor}"/>${text(montageX,hejsY-16,'MONTAGE','side-label','text-anchor="middle"')}`:''}${text(truckX,y+43,sourceName(r),'side-label','text-anchor="middle"')}</svg></div>`;
}
