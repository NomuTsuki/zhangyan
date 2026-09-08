// review required: new presentation checks, not frozen game acceptance tests.
import { createRequire } from 'node:module';
import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const modulePath=process.argv[2];
if(!modulePath)throw new Error('Pass an installed Playwright module directory as argument 1.');
const { chromium }=require(resolve(modulePath));
const url=process.argv[3]||'http://127.0.0.1:62590/';
const output=resolve('output/playwright/local-road-studies-v1');
const portfolio=resolve('docs/portfolio/2026-09-08-local-road-studies');
await mkdir(output,{recursive:true});await mkdir(portfolio,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];const checks=[];const viewports=[];
page.on('pageerror',e=>errors.push(e.message));
const click=id=>page.locator('#'+id).click();
const snap=()=>page.evaluate(()=>window.studySnapshot());
const state=async()=>{const s=await snap();return s.states[s.mode];};
const exists=id=>page.locator('#'+id).count();
async function start(mode){await page.goto(url);if(mode==='compare')await click('tab-compare');}
async function photoInputs(){await click('take-xray');await click('take-photo');await click('take-current');}
async function checkLayout(label,width){
  await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
    const svg=document.querySelector('#graph');
    const cards=[...svg.querySelectorAll('.node')].filter(n=>n.querySelector('rect')).map(n=>{
      const r=n.querySelector('rect').getBBox();
      return {id:n.id,x:r.x,y:r.y,width:r.width,height:r.height,texts:[...n.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,width:b.width,height:b.height};})};
    });
    const outside=cards.flatMap(c=>c.texts.filter(t=>t.x<c.x+4||t.x+t.width>c.x+c.width-4||t.y<c.y||t.y+t.height>c.y+c.height).map(t=>({id:c.id,text:t.text})));
    const overlaps=[];
    for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++){const a=cards[i],b=cards[j];if(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y)overlaps.push([a.id,b.id]);}
    return {pageOverflow:document.documentElement.scrollWidth>innerWidth,outside,overlaps,visibleText:document.body.innerText};
  });
  assert.equal(metrics.pageOverflow,false,label+' horizontal overflow');assert.deepEqual(metrics.outside,[],label+' text outside nodes');assert.deepEqual(metrics.overlaps,[],label+' overlapping cards');assert.equal(/\bAND\b/.test(metrics.visibleText),false);
  viewports.push({label,width,pageOverflow:metrics.pageOverflow,textOutsideNodes:metrics.outside.length,overlaps:metrics.overlaps.length});
}
try{
  await start('photo');assert.equal(await page.locator('#verify').isDisabled(),true);assert.equal(await exists('photo-history'),0);
  await click('take-xray');assert.equal(await exists('xray'),1);assert.equal(await exists('photo-history'),0);
  await click('take-photo');assert.equal(await page.locator('#verify').isDisabled(),true);
  await click('take-current');assert.equal(await page.locator('#verify').isEnabled(),true);assert.equal(await exists('photo-history'),0);
  const geometry=async()=>page.locator('#photo rect').evaluate(e=>JSON.stringify(e.getBoundingClientRect().toJSON()));
  const beforeGeometry=await geometry();const sources=JSON.stringify((await state()).log);
  await click('verify');assert.equal(await exists('photo-history'),1);assert.equal(await geometry(),beforeGeometry);assert.equal(JSON.stringify((await state()).log.slice(0,3)),sources);
  const beforeSelection=JSON.stringify((await snap()).states);
  await click('photo-match-report');assert.match(await page.locator('#detail').innerText(),/对象核验报告/);
  await page.keyboard.press('Escape');assert.equal((await snap()).selected,null);
  await page.locator('#photo-match-report').focus();await page.keyboard.press('Enter');assert.equal((await snap()).selected,'photo-match-report');
  await page.keyboard.press('Escape');assert.equal(JSON.stringify((await snap()).states),beforeSelection);
  checks.push('Photo gate, independent X-ray, stable source geometry, report click/keyboard and selection purity');

  await start('compare');await click('compare');assert.equal(await exists('temporal-change'),0);assert.match(await page.locator('#comparison-report').textContent(),/差异/);
  const oldReport=JSON.stringify((await state()).comparison);const reportGeometry=await page.locator('#comparison-report rect').boundingBox();
  await click('verify');assert.equal(await exists('temporal-change'),1);assert.equal(JSON.stringify((await state()).comparison),oldReport);assert.deepEqual(await page.locator('#comparison-report rect').boundingBox(),reportGeometry);assert.equal((await state()).log.length,2);
  await click('reset');await click('verify');assert.equal(await exists('temporal-change'),0);await click('compare');assert.equal(await exists('temporal-change'),1);assert.equal((await state()).comparison.order,2);
  checks.push('Comparison-first and attribution-first converge; original reports retain order and geometry');

  for(const outcome of ['same','incomparable']){
    await click('reset');await page.locator('#outcomes summary').click();await page.locator('#comparison-outcome').selectOption(outcome);
    await click('compare');await click('verify');assert.equal(await exists('temporal-change'),0);
    const notice=await page.locator('#notice').innerText();assert.equal(/还未取得|还要看/.test(notice),false);assert.match(notice,outcome==='same'?/未见可确认差异/:/无法比较/);
  }
  for(const outcome of ['uncertain','different']){
    await start('photo');await photoInputs();await page.locator('#outcomes summary').click();await page.locator('#match-outcome').selectOption(outcome);await click('verify');assert.equal(await exists('photo-history'),0);assert.equal(await exists('photo-match-report'),1);
  }
  checks.push('No difference, incomparable, uncertain identity and mismatched identity keep reports without historical outputs');

  await start('photo');await click('take-photo');const preserved=JSON.stringify(await state());
  await click('tab-compare');await click('compare');await click('reset');await click('tab-photo');assert.equal(JSON.stringify(await state()),preserved);
  await click('take-current');await click('verify');await click('reset');assert.equal(await exists('photo-history'),0);assert.equal((await state()).log.length,0);
  await page.waitForTimeout(650);assert.equal(await exists('photo-history'),0);
  checks.push('Examples retain independent state; reset during connection leaves no delayed result');

  for(const width of [1280,1440,1920]){
    await page.setViewportSize({width,height:1000});await start('photo');await checkLayout('photo-initial',width);
    await photoInputs();await checkLayout('photo-pending',width);await click('verify');await checkLayout('photo-connected',width);
    await page.screenshot({path:join(output,`photo-connected-final-${width}.png`),animations:'disabled'});
    await click('tab-compare');await click('compare');await checkLayout('comparison-pending',width);await click('verify');await checkLayout('comparison-connected',width);
    await page.screenshot({path:join(output,`comparison-connected-final-${width}.png`),animations:'disabled'});
  }
  await page.emulateMedia({reducedMotion:'reduce'});await start('compare');await click('compare');await click('verify');assert.equal(await page.locator('#change-road').evaluate(e=>getComputedStyle(e).animationName),'none');
  checks.push('Three desktop widths and reduced-motion final state');
  assert.deepEqual(errors,[]);

  const captureContext=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,recordVideo:{dir:join(output,'video'),size:{width:1440,height:1000}}});
  const capture=await captureContext.newPage();await capture.goto(url);await capture.locator('#take-xray').click();await capture.locator('#take-photo').click();await capture.locator('#take-current').click();
  await capture.screenshot({path:join(portfolio,'2026-09-08-photo-before-2x.png'),animations:'disabled'});await capture.waitForTimeout(1800);
  await capture.locator('#verify').click();await capture.waitForTimeout(900);await capture.screenshot({path:join(portfolio,'2026-09-08-photo-after-2x.png'),animations:'disabled'});await capture.waitForTimeout(1700);
  await capture.locator('#tab-compare').click();await capture.locator('#compare').click();await capture.screenshot({path:join(portfolio,'2026-09-08-difference-before-2x.png'),animations:'disabled'});await capture.waitForTimeout(2300);
  await capture.locator('#verify').click();await capture.waitForTimeout(900);await capture.screenshot({path:join(portfolio,'2026-09-08-difference-after-2x.png'),animations:'disabled'});await capture.waitForTimeout(2300);
  await capture.locator('#reset').click();await capture.locator('#verify').click();await capture.waitForTimeout(2000);await capture.locator('#compare').click();await capture.waitForTimeout(2500);
  const video=capture.video();await captureContext.close();await copyFile(await video.path(),join(portfolio,'2026-09-08-two-road-sequences.webm'));
  const sha256=createHash('sha256').update(await readFile(new URL('prototype.html',import.meta.url))).digest('hex');
  const result={sha256,checks,viewports,pageErrors:errors,scope:'Local candidate only. No human experience or full-game validation.'};
  await writeFile(new URL('browser-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n','utf8');
  console.log(JSON.stringify({checks:checks.length,layoutStates:viewports.length,pageErrors:errors.length,sha256},null,2));
}finally{await browser.close();}
