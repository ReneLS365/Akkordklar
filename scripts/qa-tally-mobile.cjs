const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {mkdirSync}=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AKKORDKLAR_CHROMIUM||undefined,headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:360,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.AKKORDKLAR_QA_URL||'http://127.0.0.1:4173');
  await page.locator('[data-back-tally]').click();
  await page.locator('[data-sheet-search]').fill('3e');
  await page.locator('[data-sheet-quantity="3e"]').fill('20');
  for(const width of [360,390,430]){
   await page.setViewportSize({width,height:800});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Optælling løber ud ved ${width}px`);
  }
  await page.locator('[data-sheet-step="2"]').first().click();
  await page.locator('[data-route="ground"]').fill('25');
  await page.locator('[data-sheet-step="3"]').first().click();
  assert.match(await page.locator('[data-sheet-total]').innerText(),/367,22/);
  for(const width of [360,390,430]){
   await page.setViewportSize({width,height:800});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Resultat løber ud ved ${width}px`);
  }
  await page.locator('[data-sheet-approved]').check();
  await page.locator('[data-sheet-save]').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('akkordklar-v1')).ledger.length),1);
  assert.equal(await page.locator('[data-sheet-save]').isDisabled(),true);
  await page.reload();
  assert.match(await page.locator('[data-sheet-total]').innerText(),/367,22/);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.tally-no-print').isVisible(),false);
  const output=process.env.AKKORDKLAR_QA_OUTPUT||'/tmp';mkdirSync(output,{recursive:true});
  await page.pdf({path:`${output}/akkordseddel-example.pdf`});
  assert.deepEqual(errors,[]);
  console.log('PASS: optælling, 360/390/430px, gem én gang, genindlæsning og PDF.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
