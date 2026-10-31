/** Verified selection, not an exhaustive material catalogue.
 * Source: supplied HP3 Provinsen 2026, pp. 13, 26-40; Hvidbog A13/A26.
 * Money values are kr. Decimal products are rounded once per complete line.
 */
export const PRICE_VERSION = 'HP3 Provinsen · vejledende 2026 · 01.01.2026–28.02.2027';
export const PRICE_NOTE = '2026-udgaven er vejledende: 2025-priser +2,7 %. Den aftalte 2025-priskurant er det formelle grundlag ved fagretlig behandling (Forord s. 3).';

const material=(id,label,unit,rate,marks='GTH',extra={})=>Object.freeze({id,label,unit,rate,G:marks.includes('G'),T:marks.includes('T'),H:marks.includes('H'),demontageFactor:marks.includes('G')?.5:1,ref:`HP3 2026 · pkt. ${id}`,...extra});
export const MATERIALS = Object.freeze([
  material('1a','Fodspindel','piece',2.75),
  material('1b','Opklodsning','piece',3.45),
  material('1c','Strø / trykudligning','piece',1.82),
  material('2a','Facaderamme','piece',17.16),
  material('2b','Gennemgangsramme','piece',46.07),
  material('3b','Søjle 0,50 m','piece',4.29),
  material('3c','Søjle 1,00 m','piece',8.58),
  material('3d','Søjle 1,50 m','piece',12.87),
  material('3e','Søjle 2,00 m','piece',17.16),
  material('3f','Søjle 2,50 m','piece',21.45),
  material('3g','Søjle 3,00 m','piece',25.74),
  material('4g','Horisontal 2,50 m','piece',6.43),
  material('4h','Horisontal 3,00 m','piece',9.65),
  material('4o','Diagonal','piece',9.65),
  material('5g','Dobbeltgelænder 2,50 m','piece',8.04),
  material('5h','Dobbeltgelænder 3,00 m','piece',10.72),
  material('5l','Midlertidigt opskydeligt gelænder / stemmegaffel','room',10.02,'G'),
  material('5m','Gelænderklips','piece',6.43,'G'),
  material('6a','Konsol 0,40 m','piece',11.33),
  material('6b','Konsol 0,70 m','piece',15.56),
  material('7.1f','Alu-/finér-/kompositdæk 1/1 bredde · 2,00 m','piece',12.87),
  material('7.1g','Alu-/finér-/kompositdæk 1/1 bredde · 2,50 m','piece',12.87),
  material('7.1h','Alu-/finér-/kompositdæk 1/1 bredde · 3,00 m','piece',17.16),
  material('7.1i','Alu-/finér-/kompositdæk 1/1 bredde · 3,50 m','piece',21.44),
  material('7.2g','Alu-/finér-/kompositdæk 3/4 bredde · 2,50 m','piece',8.58),
  material('7.2h','Alu-/finér-/kompositdæk 3/4 bredde · 3,00 m','piece',12.87),
  material('7.3g','Alu-/finér-/kompositdæk 1/2 bredde · 2,50 m','piece',6.43),
  material('7.3h','Alu-/finér-/kompositdæk 1/2 bredde · 3,00 m','piece',8.58),
  material('7.4a','Opgangsdæk 2,00 m · ekskl. stige / lejder','piece',12.87),
  material('7.4b','Opgangsdæk 2,50 m · ekskl. stige / lejder','piece',17.16),
  material('7.4c','Opgangsdæk 3,00 m · ekskl. stige / lejder','piece',21.44),
  material('7.4d','Stige / lejder til opgangsdæk','piece',4.63),
  material('8g','Ståldæk / rist i halv bredde · 2,50 m','piece',10.72),
  material('8h','Ståldæk / rist i halv bredde · 3,00 m','piece',16.08),
  material('9a','Trætralle 1,25 × 0,50 m','piece',8.58),
  material('9b','Trætralle 2,20 × 0,38 m','piece',10.72),
  material('9c','Trætralle 2,20 × 0,50 m','piece',15.02),
  material('9d','Alu- / komposittralle 2,20 × 0,50 m','piece',10.72),
  material('9e','Alu- / kompositopgangstralle 2,20 × 0,50 m','piece',15.02),
  material('10a','Trappeløb alu med repos · ekskl. hegn','piece',52.71),
  material('10b','Trappeløb alu med løse repos','piece',51.55),
  material('10c','Trappeløb stål med løse repos','piece',64.42),
  material('10d','Repos til trappeløb','piece',12.89),
  material('10e','Hegn til trappeløb','piece',13.75),
  material('10f','STV-lejder','piece',30.71),
  material('10g','Stilladsplanke','piece',12.59),
  material('11a','Fodliste 0,75 m','piece',6.43),
  material('11b','Fodliste 1,00 m','piece',6.43),
  material('11c','Fodliste 1,25 m','piece',6.43),
  material('11d','Fodliste 1,50 m','piece',6.43),
  material('11e','Fodliste 1,75 m','piece',8.58),
  material('11f','Fodliste 2,00 m','piece',8.58),
  material('11g','Fodliste 2,50 m','piece',8.58),
  material('11h','Fodliste 3,00 m','piece',9.65),
  material('11i','Fodliste 3,50 m','piece',10.72),
  material('11j','Fodliste 4,00 m','piece',12.87),
  material('11k','Fodliste- / fodbrætlåsebeslag','piece',1.17),
  material('12a','Kasseskærm til og med 1 m over gulv','room',28.74),
  material('12b','Kasseskærm over 1 m til og med 1,8 m over gulv','room',52.18),
  material('12c','Tæt afdækning med finér 12 mm','sqm',8.43),
  material('12d','Tæt afdækning med finér 16 mm','sqm',9.84),
  material('12e','Tæt afdækning med finér 18 mm','sqm',12.03),
  material('12f','Tæt afdækning med finér 22 mm','sqm',16.98),
  material('12i','Reel udskæring til tæt finér langs facade','piece',23.80,'',{mountOnly:true,ref:'HP3 2026 · pkt. 12i · A28; Hvidbog A28/F1–F5 (ældre henvisning 12j)'}),
  material('13i','Boring af hul til og med 12 mm','piece',4.83,''),
  material('13j','Boring af hul over 12 til 16 mm','piece',11.80,''),
  material('13k','Boring i beton til og med 12 mm','piece',11.80,''),
  material('13l','Boring i beton over 12 til 16 mm','piece',18.23,''),
  material('13m','Lukning af hul med kit / mørtel / maling / silikone','piece',3.54,''),
  material('13n','Lukning af hul med prop','piece',2.82,''),
  material('14b','Stilladsrør alu over 1,5 m','m',4.10),
  material('14c','Stilladsrør stål over 1,5 m','m',5.66),
  material('14d','Kobling','piece',4.10),
  material('15a','Armeret plastfolie bredde 2,25 m','sqm',6.23,'GH'),
  material('15b','Armeret plastfolie bredde 3,30 m','sqm',7.02,'GH'),
  material('15c','Armeret plastfolie bredde 4,00 m','sqm',7.43,'GH'),
  material('15d','Udlægning af armeret plastfolie','sqm',3.67,'GH'),
  material('15e','Fastgørelse af plast langs mur','lbm',14.14,'GH'),
  material('15f','Genbrug af armeret plast / presenning','sqm',1.76,'',{mountOnly:true}),
  material('16a','Net','sqm',2.93,'G'),
  material('16b','Offshorenet','sqm',6.23,'G'),
  material('16d','Genbrug af net','sqm',.88,'',{mountOnly:true}),
  material('17a','Elhejs til og med 15 kg','piece',157.21),
  material('17c','Elhejs til og med 50 kg','piece',311.27),
  material('19h','0,80 m kipdrager med kederskinne','cm',56.98,'GTH',{tentBasis:true,ref:'HP3 2026 · pkt. 19h; pris/100 × cm · Hvidbog s. 65 · A35'}),
  material('20a','Vejskilt med fod','piece',21.22,'',{demontageFactor:1}),
  material('20b','Afspærringscylinder med fod','piece',10.61,'',{demontageFactor:1}),
  material('20c','Rødt / hvidt afmærkningsbræt','piece',6.45,'',{demontageFactor:1})
]);
export const MATERIAL_RULES = MATERIALS;
export const MATERIAL_CATALOG_NOTE = 'Udvalgte verificerede poster. Brug den relevante prisrække i PDF’en for øvrigt materiel; dette er ikke hele priskuranten.';

function decimal(value) {
  let s=String(value).trim().replace(',','.');
  if(typeof value==='number'&&Number.isFinite(value)&&value>=0){
    const normalized=value.toFixed(8);
    // Discard only binary arithmetic noise, not a genuine ninth decimal.
    if(Math.abs(value-Number(normalized))>Math.max(1e-12,Math.abs(value)*Number.EPSILON*8))throw new Error('Brug højst 8 decimaler.');
    s=normalized;
  }
  if(!/^\d+(?:\.\d{1,8})?$/.test(s))throw new Error('Brug et ikke-negativt decimaltal med højst 8 decimaler.');
  const [whole,fraction='']=s.split('.');
  return {n:BigInt(whole+fraction),d:10n**BigInt(fraction.length)};
}
/** Exact decimal multiplication, one explicit accounting display rounding. */
export function moneyProduct(...values) {
  return moneyRatio(values,[]);
}
export function moneyRatio(numeratorFactors,denominatorFactors) {
  let numerator=100n,denominator=1n;
  for(const value of numeratorFactors){const v=decimal(value);numerator*=v.n;denominator*=v.d;}
  for(const value of denominatorFactors){const v=decimal(value);if(v.n===0n)throw new Error('Der må ikke divideres med 0.');numerator*=v.d;denominator*=v.n;}
  const cents=(numerator+denominator/2n)/denominator;
  if(cents>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Beløbet er for stort.');
  return Number(cents)/100;
}
export function materialPriceLine(input) {
  const item=MATERIALS.find(m=>m.id===(input.itemId??input.id));
  if(!item)throw new Error('Ukendt materialepost. Vælg en verificeret prisrække.');
  if(input.quantity===''||input.quantity==null||typeof input.quantity==='boolean')throw new Error('Mængden mangler.');
  const quantity=Number(String(input.quantity).replace(',','.'));
  if(!Number.isFinite(quantity)||quantity<0||quantity>1e8)throw new Error('Mængden er ugyldig.');
  let billedQuantity=quantity;
  if(['piece','room'].includes(item.unit)&&!Number.isInteger(quantity))throw new Error('Stk. og rum skal være hele antal.');
  if(['m','sqm'].includes(item.unit))billedQuantity=Math.round(quantity);
  if(item.unit==='lbm')billedQuantity=Math.ceil(quantity);
  const operation=input.operation??'montage';
  if(!['montage','demontage','assembly','disassembly'].includes(operation))throw new Error('Vælg montage eller demontage.');
  const demontage=['demontage','disassembly'].includes(operation);
  const rate=item.rate;
  // Tent parts require the national Copenhagen/North Zealand price basis.
  if(item.tentBasis&&!input.correctTentBasis)throw new Error('A35: bekræft prisgrundlag København / Nordsjælland før teltmateriel afregnes.');
  const factor=demontage?(item.mountOnly?0:item.demontageFactor):1;
  const unitFactor=item.unit==='cm'?.01:1;
  const fullAmount=moneyProduct(rate,billedQuantity,unitFactor);
  const workAmount=moneyProduct(rate,billedQuantity,unitFactor,factor);
  return {...item,operation,quantity,billedQuantity,fullAmount,
    fullBase:item.G?fullAmount:0,workAmount,
    tBase:item.G&&item.T?fullAmount:0,
    hBase:item.G&&item.H?workAmount:0,
    otherAmount:item.G?0:workAmount,
    formula:`${billedQuantity} ${item.unit} × ${rate}${item.unit==='cm'?' / 100':''}${factor!==1?` × ${factor}`:''}`};
}
