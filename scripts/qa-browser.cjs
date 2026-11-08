const http=require('node:http');
const {createReadStream,mkdtempSync}=require('node:fs');
const {stat}=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawn}=require('node:child_process');

const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf'};
const server=http.createServer(async(request,response)=>{
 try{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const file=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
  if(!file.startsWith(root+path.sep)||(await stat(file)).isDirectory()){response.writeHead(404).end();return;}
  response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
  createReadStream(file).pipe(response);
 }catch{response.writeHead(404).end();}
});
async function run(script,env){
 const child=spawn(process.execPath,[path.join(__dirname,script)],{env,stdio:'inherit'});
 const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
 if(result!==0)throw new Error(`${script}: exit ${result}`);
}
(async()=>{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 try{
  const env={...process.env,AKKORDKLAR_QA_URL:`http://127.0.0.1:${server.address().port}`,AKKORDKLAR_QA_OUTPUT:process.env.AKKORDKLAR_QA_OUTPUT||mkdtempSync(path.join(os.tmpdir(),'akkordklar-qa-'))};
  for(const script of ['qa-transport.cjs','qa-tally-mobile.cjs','qa-tally-offline.cjs'])await run(script,env);
  console.log('PASS: alle tre browsertestforløb.');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
