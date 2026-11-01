import {readdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const source=new URL('../dist/',import.meta.url);
const targets=['android/app/src/main/assets/public/','ios/App/App/public/'];
function files(directory,prefix=''){
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const relative=prefix+entry.name;
    return entry.isDirectory()?files(new URL(`${entry.name}/`,directory),`${relative}/`):[relative];
  });
}
const assets=files(source),errors=[];
for(const target of targets)for(const asset of assets){
  const copy=new URL(`../${target}${asset}`,import.meta.url);
  try{
    if(!readFileSync(new URL(asset,source)).equals(readFileSync(copy)))errors.push(`Afviger fra dist/: ${fileURLToPath(copy)}`);
  }catch(error){
    if(error.code!=='ENOENT')throw error;
    errors.push(`Mangler native-kopi: ${fileURLToPath(copy)}`);
  }
}
if(errors.length){
  console.error(errors.join('\n'));
  process.exitCode=1;
}else console.log(`${assets.length} dist-filer er identiske i både Android og iOS.`);
