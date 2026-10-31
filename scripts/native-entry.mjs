import {Capacitor} from '@capacitor/core';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
export const isNative = () => Capacitor.isNativePlatform();
export async function shareText(text) {return Share.share({title:'Akkordklar · beregningsark',text,dialogTitle:'Del dit beregningsark'});}
export async function shareFile(name,text) {
 const path=name.replace(/[^a-z0-9.-]/gi,'-');
 const {uri}=await Filesystem.writeFile({directory:Directory.Cache,path,data:text,encoding:Encoding.UTF8});
 return Share.share({title:'Akkordklar · sikkerhedskopi',files:[uri],dialogTitle:'Gem eller del sikkerhedskopien'});
}
