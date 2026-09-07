import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { ACTIONS, ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";
const here=dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const pw=require(process.argv[2] || "playwright");
const executablePath=process.argv[3] || undefined;
const browser=await pw.chromium.launch({headless:true, ...(executablePath?{executablePath}:{})});
const output=resolve(here,"../../../../../../output/playwright/fusion-v0");
await mkdir(output,{recursive:true});
const report={builtHtmlSha256:createHash("sha256").update(await readFile(resolve(here,"prototype.html"))).digest("hex"),results:[],screenshots:[],errors:[]};
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(8000);
page.on("pageerror",e=>report.errors.push(e.message));
const snapshot=()=>page.evaluate(()=>window.fusionSnapshot());
const route16=["A.OBSERVE.WHOLE","A.OBSERVE.BASE","A.VERIFY.OBJECT_CONTINUITY","A.RESEARCH.ACCIDENT","A.RELATE.ARCHIVE.T2_TO_OBJECT","A.CORROBORATE.ARCHIVE.T2_CURRENT","A.LOCATE.HISTORIC_IMAGE","A.RESEARCH.LATE_TREATMENT","A.RELATE.ARCHIVE.T3_TO_OBJECT","A.CORROBORATE.ARCHIVE.T3_CURRENT","A.ANALYZE.MATERIAL.SUBSTRATE","A.INSPECT.MATERIAL.LAYER_SEQUENCE","A.INSPECT.WINDOWS","A.SYNTHESIZE.SURFACE_REGIONS","A.ASSESS.TREATED_AND_UNTREATED","A.TRACE.PROVENANCE_CHAIN"];
async function load(width=1440,reduced=false) {
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:reduced?"reduce":"no-preference"});
  await page.goto(pathToFileURL(resolve(here,"prototype.html")).href);
  await page.waitForFunction(()=>typeof window.fusionSnapshot==="function");
}
async function investigate(id) {
  const place=ACTION_BY_ID.get(id).place;
  await page.locator('.bench [data-kind="place"][data-id="'+place+'"]').click();
  await page.locator('#action-pop [data-take="'+id+'"]').click();
  return snapshot();
}
async function picture(name) {
  await page.mouse.move(2,2);
  await page.waitForFunction(()=>window.fusionSnapshot().transient===null);
  await page.screenshot({path:resolve(output,name+".png")});
  report.screenshots.push("output/playwright/fusion-v0/"+name+".png");
}
async function clickRoad(id) {
  const locator=page.locator('.route-hit[data-kind="edge"][data-id="'+id+'"]').first();
  await locator.scrollIntoViewIfNeeded();
  // A curved SVG path's bounding-box center may lie on an unrelated node.
  // Click an actual visible stroke point, checking the real DOM hit target.
  const point=await locator.evaluate(el=>{
    const matrix=el.getScreenCTM(),length=el.getTotalLength();
    for(const fraction of [.5,.35,.65,.2,.8,.1,.9]){
      const p=el.getPointAtLength(length*fraction),screen=new DOMPoint(p.x,p.y).matrixTransform(matrix);
      const hit=document.elementFromPoint(screen.x,screen.y)?.closest('[data-kind="edge"]');
      if(hit?.dataset.id===el.dataset.id)return {x:screen.x,y:screen.y};
    }
    return null;
  });
  assert.ok(point,"Road must have an unobstructed pointer target: "+id);
  await page.mouse.click(point.x,point.y);
}
async function check(name,fn) {
  await fn();report.results.push({name,status:"PASS"});console.log("PASS "+name);
}
async function verifyRenderedBounds() {
  const geometry=await page.evaluate(()=>{
    const elements=[...document.querySelectorAll("#node-controls .node-control")];
    const overflow=elements.filter(el=>[...el.querySelectorAll(".node-title,.node-state")].some(t=>t.scrollHeight>t.clientHeight+1||t.scrollWidth>t.clientWidth+1)).map(el=>el.dataset.id);
    const collisions=[];for(let i=0;i<elements.length;i++)for(let j=i+1;j<elements.length;j++){const a=elements[i].getBoundingClientRect(),b=elements[j].getBoundingClientRect();if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)collisions.push([elements[i].dataset.id,elements[j].dataset.id]);}
    return {overflow,collisions,pageOverflow:document.documentElement.scrollWidth>window.innerWidth};
  });
  assert.deepEqual(geometry.overflow,[]);assert.deepEqual(geometry.collisions,[]);assert.equal(geometry.pageOverflow,false);
}
try {
  await check("offline start; preserved 5 object / 10 external groups; neutral four judgments",async()=>{
    await load();const s=await snapshot();
    assert.equal(s.graph.nodes.length,0);assert.equal(s.graph.frontiers.length,0);
    assert.equal(await page.locator('#object [data-kind="place"]').count(),5);
    assert.equal(await page.locator('#outside [data-kind="place"]').count(),10);
    assert.equal(await page.locator(".judgment-row").count(),4);
    assert.equal(await page.locator(".bench").evaluate(el=>el.getBoundingClientRect().width),306);
    assert.equal(await page.locator(".right").evaluate(el=>el.getBoundingClientRect().width),356);
    assert.equal(await page.locator("#overview").innerText().then(t=>/晚.*18|三阶段/.test(t)),false);
    await picture("initial-1440");
  });
  await check("keyboard opens original grouped popup; unavailable inspection is non-mutating",async()=>{
    const base=page.locator('#object [data-id="OBJ_F"]');await base.focus();await page.keyboard.press("Enter");
    assert.equal(await page.locator("#action-pop").isVisible(),true);
    assert.equal(await page.locator("#action-pop [data-take]").count(),1);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),"OBJ_F");
    await page.keyboard.press("Escape");assert.equal((await snapshot()).selection,null);
    await page.locator('#outside [data-id="CORPUS"]').click();
    assert.equal(await page.locator('#action-pop [data-take]').isDisabled(),true);
    assert.match(await page.locator("#action-pop").innerText(),/底足/);
    assert.equal((await snapshot()).session.log.length,0);
    await page.keyboard.press("Escape");await page.locator("#clear-selection").click();
    await base.focus();await page.keyboard.press("Enter");await page.keyboard.press("Enter");
    assert.equal((await snapshot()).session.log.length,1);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),"OBJ_F");
    assert.equal(await page.locator("#action-pop").isVisible(),false);
    await load();
  });
  await check("early Xray/image shared question; hover does not replace pinned selection; late context",async()=>{
    await investigate("A.IMAGE.XRAY");await investigate("A.LOCATE.HISTORIC_IMAGE");
    let s=await snapshot();assert.equal(s.graph.nodes.filter(n=>n.state==="pending").length,2);assert.equal(s.graph.edges.length,0);
    assert.equal(s.graph.frontiers.find(q=>q.id==="question:context").anchorIds.length,2);
    await page.locator('#node-controls [data-kind="gap"][data-id="question:context"]').click();
    const pinned=await snapshot(),detail=await page.locator("#details").innerText();
    await page.locator('#node-controls [data-kind="evidence"]').first().hover();
    assert.deepEqual((await snapshot()).selection,pinned.selection);assert.equal(await page.locator("#details").innerText(),detail);
    await page.mouse.move(2,2);assert.equal((await snapshot()).hovered,null);
    await page.locator("#show-methods").click();
    assert.equal(await page.locator('#details [data-take="A.VERIFY.OBJECT_CONTINUITY"]').isDisabled(),true);
    await picture("pending-1440");
    await investigate("A.OBSERVE.BASE");
    s=await investigate("A.VERIFY.OBJECT_CONTINUITY");
    assert.equal(s.graph.nodes.filter(n=>n.state==="pending").length,0);
    assert.equal(s.transient.activatedNodeIds.length,2);
    assert.equal(s.solved.stage,"NONE");
    await picture("context-connected-1440");
  });
  await check("archive attribution and corroboration split; evidence/road/gap/claim cross-highlights",async()=>{
    await load();await investigate("A.OBSERVE.WHOLE");await investigate("A.RESEARCH.ACCIDENT");
    let s=await snapshot();
    const gaps=s.graph.frontiers.filter(q=>q.kind==="gap");
    assert.ok(gaps.some(q=>q.id.endsWith(":attribution")));assert.ok(gaps.some(q=>q.id.endsWith(":corroboration")));
    await page.locator('#node-controls [data-kind="gap"][data-id="'+gaps[0].id+'"]').click();
    assert.ok(await page.locator(".bench .related").count()>0);await picture("archive-gaps-1440");
    s=await investigate("A.RELATE.ARCHIVE.T2_TO_OBJECT");
    const attribution=s.graph.edges.find(e=>e.id==="archive:t2:object");assert.equal(attribution.kind,"attribution");
    assert.ok(s.graph.frontiers.some(q=>q.id.endsWith(":corroboration")));
    s=await investigate("A.CORROBORATE.ARCHIVE.T2_CURRENT");
    assert.equal(s.graph.edges.find(e=>e.id===attribution.id).kind,"corroboration");
    assert.ok(s.transient.changedEdgeIds.includes(attribution.id));assert.equal(s.solved.claims.majorReassembly.established,true);assert.equal(s.solved.stage,"NONE");
    await clickRoad(attribution.id);
    assert.ok((await page.locator("#details").innerText()).includes("关系"));
    assert.ok(await page.locator(".bench .related").count()>0);
    const positions=JSON.stringify((await snapshot()).layout.positions);
    await page.locator('#overview [data-id="claim:majorReassembly"]').click();
    assert.ok(await page.locator(".bench .related").count()>0);assert.equal(JSON.stringify((await snapshot()).layout.positions),positions);
    await picture("archive-confirmed-1440");
  });
  await check("original relation report remains selectable after endpoint compression",async()=>{
    await load();await investigate("A.RELATE.ARCHIVE.T2_TO_OBJECT");
    assert.ok((await snapshot()).graph.frontiers.some(q=>q.id==="question:archive:t2:source"));
    await investigate("A.RESEARCH.ACCIDENT");await investigate("A.OBSERVE.WHOLE");
    const s=await snapshot(),raw=s.graph.observations.find(o=>o.id==="obs.archive.t2.object-attribution");
    assert.equal(raw.representedAs,"relation");
    await clickRoad("archive:t2:object");
    await page.locator('#details [data-kind="evidence"][data-id="'+raw.id+'"]').click();
    assert.equal((await snapshot()).selection.id,raw.id);
    assert.ok(await page.locator(".route.selected").count()>0);
  });
  await check("frontier continuation; repeat no duplicate; material readings do not falsely connect",async()=>{
    await load();await investigate("A.INSPECT.WINDOWS");
    let s=await snapshot();const before=s.layout.frontierPositions["question:surface"];
    s=await investigate("A.SYNTHESIZE.SURFACE_REGIONS");
    assert.ok(!s.graph.frontiers.some(q=>q.id==="question:surface"));
    const surface=s.graph.nodes.find(n=>n.id==="obs.surface.resolved");
    assert.equal(s.layout.positions[surface.id].x,before.x);assert.equal(s.layout.positions[surface.id].y,before.y);
    const count=s.graph.nodes.length;s=await investigate("A.SYNTHESIZE.SURFACE_REGIONS");assert.equal(s.graph.nodes.length,count);
    assert.match(await page.locator("#notice").innerText(),/没有新增/);
    await investigate("A.ANALYZE.MATERIAL.SUBSTRATE");s=await investigate("A.INSPECT.MATERIAL.LAYER_SEQUENCE");
    assert.ok(!s.graph.edges.some(e=>[e.from,e.to].includes("obs.key-material.substrate-readings")&&[e.from,e.to].includes("obs.key-material.layer-sequence")));
  });
  await check("16-step real UI route, all four judgments and immutable selection",async()=>{
    await load();for(const id of route16)await investigate(id);
    const s=await snapshot();assert.equal(s.session.log.length,16);assert.equal(s.solved.stage,"G3");
    for(const key of ["identity","majorReassembly","threePhase","coherentDecisionProfile"])assert.equal(s.solved.claims[key].established,true);
    assert.equal(await page.locator(".judgment-row.established").count(),4);
    const before=JSON.stringify(s.session);await page.locator('#overview [data-id="claim:coherentDecisionProfile"]').click();
    assert.equal(JSON.stringify((await snapshot()).session),before);
    const body=await page.locator("#details").innerText();assert.ok(!/undefined|\[object Object\]/.test(body));assert.match(body,/材料|表面/);
    const facetStates=await page.locator(".facet-row .muted").allTextContents();
    assert.equal(facetStates.length,4);assert.ok(facetStates.every(text=>text.trim().length>0));
    await picture("g3-1440");
  });
  await check("history recovers exact map without spending; return-to-live retains terminal state",async()=>{
    const live=await snapshot();
    await page.locator("#history-button").click();await page.locator('#history-list [data-history="4"]').click();
    assert.equal((await snapshot()).viewSession.log.length,4);
    assert.equal((await snapshot()).session.log.length,16);
    assert.equal(await page.locator("#stop-button").isDisabled(),true);
    await page.locator('#outside [data-id="XRAY"]').click();
    assert.equal(await page.locator('#action-pop [data-take]').isDisabled(),true);
    assert.match(await page.locator("#action-pop").innerText(),/正在回看历史/);
    await page.locator("#history-live").click();
    assert.equal(await page.locator("#action-pop").isVisible(),false);
    assert.equal((await snapshot()).openPlace,null);assert.equal((await snapshot()).hovered,null);
    assert.equal((await snapshot()).historyIndex,null);assert.equal((await snapshot()).solved.stage,"G3");
    await page.locator('#outside [data-id="XRAY"]').click();
    assert.equal(await page.locator('#action-pop [data-take]').isEnabled(),true);
    await page.keyboard.press("Escape");
    assert.deepEqual((await snapshot()).layout.positions,live.layout.positions);
    await page.locator("#stop-button").click();await page.locator("#confirm-stop").click();
    assert.equal((await snapshot()).session.stopped,true);assert.equal((await snapshot()).solved.stage,"G3");
    assert.equal(await page.locator("#stop-button").isDisabled(),true);
    await picture("stopped-1440");
  });
  await check("restart/stop during connection; reduced-motion reaches final state",async()=>{
    await load();await investigate("A.OBSERVE.WHOLE");await investigate("A.RESEARCH.ACCIDENT");await investigate("A.RELATE.ARCHIVE.T2_TO_OBJECT");await investigate("A.CORROBORATE.ARCHIVE.T2_CURRENT");
    await page.locator("#restart-button").click();await page.locator("#confirm-restart").click();
    assert.equal((await snapshot()).session.log.length,0);assert.equal((await snapshot()).graph.nodes.length,0);
    await load(1440,true);await investigate("A.INSPECT.WINDOWS");await investigate("A.SYNTHESIZE.SURFACE_REGIONS");
    const animations=await page.locator(".route.connecting").evaluateAll(list=>list.map(el=>getComputedStyle(el).animationName));assert.ok(animations.every(name=>name==="none"));
    await page.locator("#stop-button").click();await page.locator("#confirm-stop").click();assert.equal((await snapshot()).session.stopped,true);
  });
  for(const width of [1280,1440,1920])await check("all 22 real UI actions and rendered bounds at "+width,async()=>{
    await load(width);
    await picture("initial-"+width);
    for(const [index,a] of ACTIONS.entries()){
      await investigate(a.id);
      if(index===10){await verifyRenderedBounds();await picture("middle-"+width);}
    }
    const s=await snapshot();assert.equal(s.session.log.length,22);assert.equal(s.solved.stage,"G3");
    await page.locator("#clear-selection").click();await page.mouse.move(2,2);
    await verifyRenderedBounds();
    await picture("full-"+width);
    await page.locator("#zoom-out").click();assert.equal((await snapshot()).zoom,.9);
    await page.locator("#map-scroll").hover();await page.mouse.wheel(0,320);await page.waitForTimeout(150);
    const scroll=await page.locator("#map-scroll").evaluate(el=>[el.scrollLeft,el.scrollTop]);
    await page.locator('#overview [data-id="claim:identity"]').click();
    assert.equal((await snapshot()).zoom,.9);
    assert.deepEqual((await snapshot()).layout.positions,s.layout.positions);
    assert.deepEqual(await page.locator("#map-scroll").evaluate(el=>[el.scrollLeft,el.scrollTop]),scroll);
    await page.locator("#zoom-in").click();assert.equal((await snapshot()).zoom,1);
  });
  assert.deepEqual(report.errors,[]);
  report.status="PASS";report.count=report.results.length;
} catch(error) {
  report.status="FAIL";report.failure=error.stack;await picture("failure");console.error(error.stack);process.exitCode=1;
} finally {
  await writeFile(resolve(here,"browser-results.json"),JSON.stringify(report,null,2)+"\n","utf8");
  console.log("Browser result: "+report.status+" / "+report.results.length+" completed scenarios; "+report.errors.length+" page errors.");
  await browser.close();
}
