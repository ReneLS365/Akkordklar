import {validateTally} from './tally.mjs';
/** Serializable, versioned device-local projects and complete JSON backups. */
export const BACKUP_SCHEMA=2;
const keys=['transport','calcs','ledger','jobName','jobNotes','sub'];
const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_.:-]{1,160}$/.test(value);
export function projectData(state){return Object.fromEntries(keys.map(k=>[k,structuredClone(state[k])]));}
export function validateTree(value,depth=0,path=[]){
 if(depth>24)throw new Error('For mange indlejrede felter i sikkerhedskopien.');
 if(value===null||typeof value==='boolean')return;
 if(typeof value==='number'){if(!Number.isFinite(value)||Math.abs(value)>1e12)throw new Error('Ugyldigt tal i filen.');return;}
 // Live v7 saved the entire tally audit in ledger[i].formula. Preserve those
 // historical snapshots; new audits use bounded auditText chunks instead.
 if(typeof value==='string'){const legacyAudit=path.at(-3)==='ledger'&&Number.isInteger(path.at(-2))&&path.at(-1)==='formula';if(value.length>(legacyAudit?1000000:100000))throw new Error('Et tekstfelt er for langt.');return;}
 if(Array.isArray(value)){if(value.length>10000)throw new Error('For mange poster i filen.');for(const [index,item] of value.entries())validateTree(item,depth+1,[...path,index]);return;}
 if(value&&typeof value==='object'){for(const [k,v] of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw new Error('Ugyldigt feltnavn i filen.');validateTree(v,depth+1,[...path,k]);}return;}
 throw new Error('Filen indeholder ugyldige data.');
}
export function validateLedger(lines){
 if(!Array.isArray(lines)||lines.length>2000)throw new Error('Ugyldige beregningslinjer.');
 for(const row of lines){if(!row||typeof row.title!=='string'||typeof row.amount!=='number'||!Number.isFinite(row.amount)||row.amount<0||typeof row.formula!=='string'||typeof row.explanation!=='string'||typeof row.source!=='string'||!['tillæg','arbejdspris','grundpris','særskilt aftale'].includes(row.kind))throw new Error('En beregningslinje er ugyldig.');if(row.id!==undefined&&!validId(row.id))throw new Error('Ugyldigt linje-ID.');if(row.percent!=null&&(!Number.isFinite(row.percent)||row.percent<0))throw new Error('Ugyldig procentsats.');if(row.zones&&(!Array.isArray(row.zones)||row.zones.some(z=>!z||typeof z.side!=='string'||![z.from,z.to,z.base,z.percent].every(v=>Number.isFinite(v)&&v>=0))))throw new Error('Ugyldige transportzoner.');}
}
export function validateProject(data){validateTree(data);if(data?.transport?.sheet)validateTally(data.transport.sheet);validateLedger(data?.ledger);if(!data.transport||typeof data.transport!=='object'||!data.transport.config||!Array.isArray(data.transport.manual)||!data.calcs||typeof data.calcs!=='object'||Array.isArray(data.calcs))throw new Error('Projektet mangler beregnerdata.');for(const row of data.transport.manual)if(!row||!validId(row.id))throw new Error('En transportlinje har ugyldigt ID.');const p=data.transport.pricing;if(p){if(p.shares!=null&&(typeof p.shares!=='object'||Array.isArray(p.shares)))throw new Error('Ugyldig sidefordeling.');if(p.materials!=null&&!Array.isArray(p.materials))throw new Error('Ugyldig materialeliste.');for(const m of p.materials||[])if(!m||!validId(m.id))throw new Error('Et materiale har ugyldigt ID.');}return data;}
export function backupPayload(state){return {schema:BACKUP_SCHEMA,app:'Akkordklar',exportedAt:new Date().toISOString(),current:projectData(state),projects:structuredClone(state.projects||[])};}
export function parseBackup(value){
 validateTree(value);
 if(value.schema===1){validateLedger(value.ledger);return {legacy:true,ledger:value.ledger,jobName:String(value.jobName||''),jobNotes:String(value.jobNotes||'')};}
 if(value.schema!==BACKUP_SCHEMA||value.app!=='Akkordklar')throw new Error('Filen er ikke en Akkordklar-sikkerhedskopi.');
 validateProject(value.current);if(!Array.isArray(value.projects)||value.projects.length>100)throw new Error('Ugyldig projektliste.');for(const p of value.projects){if(typeof p.name!=='string')throw new Error('Et projektnavn mangler.');validateProject(p.data);}return value;
}
