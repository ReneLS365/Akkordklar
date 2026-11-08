const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {mkdirSync,readFileSync}=require('node:fs');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AKKORDKLAR_CHROMIUM||undefined,headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:360,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.AKKORDKLAR_QA_URL||'http://127.0.0.1:4173');
  const step=number=>page.locator(`.transport-steps [data-tk-step="${number}"]`).click();
  const amount=()=>page.locator('[data-tk-status] strong').innerText();
  const save=()=>page.locator('[data-action="save-v2"]');
  const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('akkordklar-v1')));
  await page.locator('[data-tk-level="quick"]').click();
  await page.locator('[data-q-price="base"]').fill('1000');
  await page.locator('[data-q-price="operation"]').selectOption('demontage');
  await step(2);await page.locator('[data-tk-method="manual"]').click();
  await step(3);await page.locator('[data-tk-field="ground"]').fill('25');
  await step(4);
  assert.equal(await amount(),'70,00 kr.');
  assert.match(await page.locator('[data-tk-result]').innerText(),/570,00 kr\./);
  assert.equal(await save().isDisabled(),true);
  for(const width of [360,390,430,1280]){
   await page.setViewportSize({width,height:900});
   for(const number of [1,2,3,4]){
    await step(number);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Transporttrin ${number} løber ud ved ${width}px`);
   }
  }
  await page.setViewportSize({width:360,height:800});
  await page.locator('[data-tk-agreed]').check();await save().click();
  const historical=(await snapshot()).ledger;
  assert.equal(historical.length,1);assert.equal(historical[0].amount,70);
  await step(3);await page.locator('[data-tk-field="ground"]').fill('');
  await step(4);assert.equal(await amount(),'—');assert.equal(await save().count(),0);
  await step(3);await page.locator('[data-tk-field="ground"]').fill('55.01');
  await step(4);assert.equal(await save().count(),0);assert.match(await page.locator('[data-tk-result]').innerText(),/afklaring/i);
  await step(2);await page.locator('[data-tk-method="wheels"]').click();
  await step(4);assert.equal(await amount(),'350,00 kr.');assert.equal(await save().isDisabled(),true);
  await step(2);await page.locator('[data-tk-method="truck"]').click();
  await step(3);await page.locator('[data-tk-field="ground"]').fill('150.01');
  await step(4);assert.equal(await amount(),'140,00 kr.');
  await step(2);await page.locator('[data-tk-method="manual"]').click();
  await step(3);await page.locator('[data-tk-field="ground"]').fill('0');
  await step(4);assert.equal(await save().count(),0);
  await step(2);await page.locator('[data-tk-field="handlingConfirmed"]').check();
  await step(4);assert.equal(await amount(),'70,00 kr.');
  await step(3);await page.locator('[data-tk-field="ground"]').fill('25');
  await page.locator('[data-tk-field="stage"]').selectOption('scaffold');
  await page.locator('[data-tk-field="scaffold"]').fill('15');
  assert.equal(await amount(),'70,00 kr.');
  await page.locator('[data-tk-field="ground"]').fill('25.01');
  await page.locator('[data-tk-field="scaffold"]').fill('10.01');
  assert.equal(await amount(),'210,00 kr.');
  await step(2);
  await page.getByText('Særlige forhold og aftalt sats',{exact:true}).click();
  await page.locator('[data-tk-field="special"]').check();
  await page.locator('[data-tk-field="agreedRate"]').fill('40');
  await page.locator('[data-tk-field="agreementNote"]').fill('QA: samlet aftale inklusive omlæsning');
  await page.locator('[data-tk-field="agreementConfirmed"]').check();
  await page.locator('[data-tk-field="reload"]').check();
  await step(4);assert.equal(await amount(),'400,00 kr.');
  await page.reload();await page.locator('.transport-workspace').waitFor();
  assert.equal(await amount(),'400,00 kr.');assert.deepEqual((await snapshot()).ledger,historical);
  if(process.env.AKKORDKLAR_QA_OUTPUT){mkdirSync(process.env.AKKORDKLAR_QA_OUTPUT,{recursive:true});await page.screenshot({path:`${process.env.AKKORDKLAR_QA_OUTPUT}/transport-mobile.png`,fullPage:true});}
  await page.locator('[data-tab="overview"]:visible').first().click();
  const downloaded=page.waitForEvent('download');await page.locator('[data-action="backup"]').click();
  const backup=readFileSync(await (await downloaded).path());
  assert.equal(JSON.parse(backup).current.ledger[0].amount,70);
  const projectsBefore=(await snapshot()).projects.length;
  await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
  await page.waitForFunction(count=>JSON.parse(localStorage.getItem('akkordklar-v1')).projects.length>count,projectsBefore);
  assert.deepEqual((await snapshot()).ledger,historical);
  const legacy=JSON.parse(backup),audit='Historisk live-v7-revisionsspor.\n'.repeat(5000);
  legacy.current.ledger[0].formula=audit;
  legacy.projects=[];
  const beforeLegacy=(await snapshot()).projects.length;
  await page.locator('#import-file').setInputFiles({name:'live-v7-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
  await page.waitForFunction(count=>JSON.parse(localStorage.getItem('akkordklar-v1')).projects.length>count,beforeLegacy);
  const restored=(await snapshot()).projects.at(-1).data.ledger[0];
  assert.equal(restored.formula,audit);assert.equal(restored.amount,70);
  assert.deepEqual((await snapshot()).ledger,historical);
  assert.deepEqual(errors,[]);
  console.log('PASS: fire transporttrin, 360/390/430/1280px, demontage-T, afklaringskrav, A7, stillads, A8/A31, historiske snapshots og backup/import.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
