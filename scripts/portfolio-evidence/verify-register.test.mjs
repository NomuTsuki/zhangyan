import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { verifyRegister, DEFAULT_POLICY } from './verify-register.mjs';

const exec = promisify(execFile);
const items = [
 ['DOC-PITCH-01',34374],['DOC-REPORT-01',15125],['PKG-BOOTSTRAP-01',4545757],['ARCH-LATE-01',47314],['ARCH-LATE-SVG-01',146365],['ARCH-LATE-PNG-01',664582],['DOC-WEEK1-DRAFT-01',17191],['DOC-WEEK1-DRAFT-02',16176],['DOC-WEEK1-DRAFT-03',13032],['IMG-DIAG-DESKTOP-01',284937],['IMG-DIAG-MOBILE-01',100488],['IMG-TRADE-DESKTOP-01',234371],['IMG-TRADE-MOBILE-01',97754],['IMG-RESULT-DESKTOP-01',286861],['IMG-RESULT-MOBILE-01',100350]
];
const gateRuns=[['GATE-12.2.1','RUN-REGISTER-01'],['GATE-12.2.2','RUN-COPY-01'],['GATE-12.2.3','RUN-RECOVERY-01'],['GATE-12.2.4','RUN-IMG-01'],['GATE-12.2.5','RUN-ARCH-01'],['GATE-12.2.6','RUN-DOCX-01'],['GATE-12.2.7','RUN-HTML-01'],['GATE-12.2.8','RUN-GIT-01'],['GATE-12.2.8','RUN-ARCHIVE-01'],['GATE-12.2.9','RUN-PRIVACY-01'],['GATE-12.2.10','RUN-PRESERVE-01'],['GATE-12.2.11','RUN-PROJECT-CHECK-01'],['GATE-12.2.12','RUN-HONESTY-01']];
const hex=b=>createHash('sha256').update(b).digest('hex').toUpperCase();
test('exposes an immutable complete production copy and overlay policy',()=>{
  assert.equal(Object.isFrozen(DEFAULT_POLICY),true);
  assert.equal(DEFAULT_POLICY.copies.length,15);
  assert.equal(DEFAULT_POLICY.copies.reduce((sum,copy)=>sum+copy.bytes,0),6604677);
  assert.equal(DEFAULT_POLICY.overlayManifestPath,'D:\\实习工作\\掌眼_恢复点\\2026-08-03-v1-preflight\\uncommitted-files.sha256.json');
});
async function fixture(mutator) { const dir=await mkdtemp(path.join(tmpdir(),'verify-register-')), capsule=path.join(dir,'capsule'); await mkdir(capsule); const assets=[];
 for(const [id,bytes] of items){const data=Buffer.alloc(bytes,id.charCodeAt(0)), source=path.join(dir,`${id}.src`),destinationPath=path.join(capsule,`${id}.bin`),sha256=hex(data);await writeFile(source,data);await writeFile(destinationPath,data);assets.push({schemaVersion:1,assetId:id,sourceGroup:'fixture',recordType:'file',source:{absolutePath:source,manifestRef:path.join(dir,'manifest')},file:{name:`${id}.bin`,mediaType:'application/octet-stream',bytes,sha256,dimensions:null,pages:null},identity:'fixture',stage:'V1',authority:'test',masterId:id,supports:[],doesNotSupport:[],provenance:{creator:'test',thirdParty:[],license:'private'},privacy:{status:'private',risks:[]},storageStatus:'private-master-copied',useStatus:'private-only',duplicateOf:null,destinationPath,rebuild:null,riskAcceptance:null,verificationRefs:['RUN-COPY-01'],copyVerification:{sourceBytes:bytes,destinationBytes:bytes,sourceSha256:sha256,destinationSha256:sha256}})}
 const overlayManifestPath=path.join(dir,'overlay.json'),manifest=Array.from({length:31},(_,i)=>({path:`p/${i}`,category:'overlay',length:i+1,sha256:hex(Buffer.from(String(i)))})); await writeFile(overlayManifestPath,JSON.stringify(manifest)); const overlayIds=manifest.map((m,i)=>`REC-UNCOMMITTED-${String(i+1).padStart(3,'0')}`); for(let i=0;i<31;i++)assets.push({schemaVersion:1,assetId:overlayIds[i],sourceGroup:'overlay',recordType:'file',source:{absolutePath:'virtual',manifestRef:overlayManifestPath,relativePath:manifest[i].path,category:manifest[i].category},file:{name:'x',mediaType:'application/octet-stream',bytes:manifest[i].length,sha256:manifest[i].sha256,dimensions:null,pages:null},identity:'x',stage:'V1',authority:'x',masterId:overlayIds[i],supports:[],doesNotSupport:[],provenance:{},privacy:{},storageStatus:'private-recovery-master-verified-in-place',useStatus:'private-only',duplicateOf:null,destinationPath:null,rebuild:null,riskAcceptance:null,recovery:{containerAssetId:'DOC-PITCH-01',manifestAssetId:'DOC-REPORT-01',memberPath:manifest[i].path},verificationRefs:['RUN-RECOVERY-01']}); assets.push({schemaVersion:1,assetId:'REC-UNCOMMITTED-COLLECTION-01',sourceGroup:'overlay',recordType:'collection',source:{manifestRef:overlayManifestPath},file:null,identity:'x',stage:'V1',authority:'x',masterId:null,supports:[],doesNotSupport:[],provenance:{},privacy:{},storageStatus:'rebuildable',useStatus:'private-only',duplicateOf:null,destinationPath:null,rebuild:{sourceAssetIds:['DOC-PITCH-01'],command:'x',expectedOutput:'x'},riskAcceptance:null,verificationRefs:[],memberCount:31,memberAssetIds:overlayIds}); const runs=gateRuns.map(([gateId,runId])=>({runId,gateId,at:'2026-08-04T00:00:00.000Z',reviewer:'qa',status:'PASS',assetIds:runId==='RUN-COPY-01'?assets.slice(0,15).map(a=>a.assetId):runId==='RUN-RECOVERY-01'?overlayIds:[items[0][0]],commandOrMethod:'read-only',exitCode:0,observations:'ok',blindSpots:'none'})); assets[0].verificationRefs=runs.filter(r=>r.assetIds.includes(assets[0].assetId)).map(r=>r.runId); for(const a of assets.slice(1,15))a.verificationRefs=['RUN-COPY-01']; if(mutator)await mutator({dir,capsule,assets,runs});const register=path.join(dir,'assets.jsonl'),runFile=path.join(dir,'runs.jsonl');await writeFile(register,assets.map(JSON.stringify).join('\n'));await writeFile(runFile,runs.map(JSON.stringify).join('\n'));const policy={copies:assets.slice(0,15).map(a=>({assetId:a.assetId,source:a.source.absolutePath,destination:path.relative(capsule,a.destinationPath),bytes:a.file.bytes,sha256:a.file.sha256})),overlayManifestPath,overlayCollectionId:'REC-UNCOMMITTED-COLLECTION-01'};return {dir,assets,runs,options:{register,runs:runFile,capsule,mode:'close',policy}} }
async function check(mutator){const f=await fixture(mutator);try{return await verifyRegister(f.options)}finally{await rm(f.dir,{recursive:true,force:true})}}

test('accepts a real 15-file, 6604677-byte close capsule',async()=>{const r=await check();assert.equal(r.ok,true,r.summary.errors.join('\n'));assert.equal(r.summary.copiedBytes,6604677);assert.equal(r.summary.copiedFileCount,15)});
test('rejects absent copy verification, absent capsule, escaped destination and changed bytes',async()=>{let r=await check(async({assets})=>{delete assets[0].copyVerification});assert.match(r.summary.errors.join('\n'),/copyVerification/);r=await check(async({assets})=>{assets[0].destinationPath='C:\\outside.bin'});assert.match(r.summary.errors.join('\n'),/escapes capsule/);r=await check(async({capsule,assets})=>{await rm(capsule,{recursive:true});assets[0].file.bytes=1});assert.match(r.summary.errors.join('\n'),/capsule must be an existing directory/)});
test('draft reports sorted unresolved assets and pending checks',async()=>{
  const f=await fixture(async({assets})=>{assets[1].storageStatus=null;assets[0].storageStatus=null});
  f.options.mode='draft'; delete f.options.runs; delete f.options.capsule;
  try { const r=await verifyRegister(f.options); assert.deepEqual(r.summary.unresolvedAssets,[items[0][0],items[1][0]]); }
  finally { await rm(f.dir,{recursive:true,force:true}); }
});
test('draft retains copy evidence on unresolved assets without counting terminal copies',async()=>{
  const f=await fixture(async({assets})=>{for(const asset of assets.slice(0,15))asset.storageStatus=null});
  f.options.mode='draft';
  try {
    const r=await verifyRegister(f.options);
    assert.equal(r.ok,true,r.summary.errors.join('\n'));
    assert.equal(r.summary.unresolvedCount,15);
    assert.deepEqual(r.summary.unresolvedAssets,items.map(([id])=>id).sort());
    assert.equal(r.summary.copiedFileCount,0);
    assert.equal(r.summary.copiedBytes,0);
    assert.deepEqual(r.summary.errors,[]);
    for(const asset of f.assets.slice(0,15)){
      assert.ok(asset.destinationPath);
      assert.ok(asset.copyVerification);
      assert.ok(asset.verificationRefs.includes('RUN-COPY-01'));
    }
  } finally { await rm(f.dir,{recursive:true,force:true}); }
});
test('rejects 31-member omissions, duplicate cycles, unresolved terminal references and illegal risk approval',async()=>{let r=await check(async({assets})=>{assets.push({...assets[0],assetId:'COL',recordType:'collection',file:null,source:{manifestRef:'m'},memberCount:31,memberAssetIds:['REC-UNCOMMITTED-001'],storageStatus:'rebuildable',rebuild:{sourceAssetIds:['MISSING'],command:'x',expectedOutput:'x'}})});assert.match(r.summary.errors.join('\n'),/collection contract incomplete/);r=await check(async({assets})=>{assets[0].storageStatus='duplicate-reference';assets[0].duplicateOf=assets[0].assetId});assert.match(r.summary.errors.join('\n'),/duplicate cycle/);r=await check(async({assets})=>{assets[0].storageStatus='withheld-in-place-risk-accepted';assets[0].riskAcceptance={approvedBy:'agent',approvedAt:'bad',scope:assets[0].assetId}});assert.match(r.summary.errors.join('\n'),/risk acceptance invalid/)});
test('allows nullable archive manifest and rejects run mapping, duplicate runs and empty asset ids',async()=>{let r=await check(async({assets})=>{assets[0].recordType='archive';assets[0].archive={format:'zip',memberCount:0,manifestAssetId:null}});assert.equal(r.ok,true);r=await check(async({runs})=>{runs[0].runId=runs[1].runId;runs[2].assetIds=[]});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/duplicate runId|invalid run/)});
test('CLI rejects missing, unknown, duplicate arguments and null JSONL with stable JSON errors',async()=>{
  for(const args of [[],['--bogus','x'],['--register','x','--register','y']]) try { await exec(process.execPath,['scripts/portfolio-evidence/verify-register.mjs',...args],{cwd:process.cwd()}); assert.fail('should fail'); } catch(e) { assert.doesNotThrow(()=>JSON.parse(e.stdout)); }
  const d=await mkdtemp(path.join(tmpdir(),'verify-null-'));
  try { const p=path.join(d,'x.jsonl'); await writeFile(p,'null\n'); try { await exec(process.execPath,['scripts/portfolio-evidence/verify-register.mjs','--register',p],{cwd:process.cwd()}); assert.fail('should fail'); } catch(e) { assert.match(JSON.parse(e.stdout).errors.join(' '),/object/); } }
  finally { await rm(d,{recursive:true,force:true}); }
});

async function mutateCheck(mutator){const f=await fixture(mutator);try{return await verifyRegister(f.options)}finally{await rm(f.dir,{recursive:true,force:true})}}
function appendRunSuccessor({assets,runs},overrides={}){
  const root=runs.find(run=>run.runId==='RUN-DOCX-01');
  const successor={...root,runId:'RUN-DOCX-02',at:'2026-08-04T01:00:00.000Z',status:'PASS',exitCode:0,supersedesRunId:root.runId,observations:'retry passed',...overrides};
  runs.push(successor);
  for(const id of successor.assetIds)assets.find(asset=>asset.assetId===id).verificationRefs.push(successor.runId);
  return {root,successor};
}
test('accepts BOM overlay manifest and slash policy destinations',async()=>{
  const f=await fixture(async({assets,dir})=>{const p=path.join(dir,'overlay.json');const body=await (await import('node:fs/promises')).readFile(p,'utf8');await writeFile(p,`\uFEFF${body}`);});
  try { f.options.policy.copies=f.options.policy.copies.map(p=>({...p,destination:p.destination.replaceAll('\\','/')})); const r=await verifyRegister(f.options);assert.equal(r.ok,true,r.summary.errors.join('\n')); } finally { await rm(f.dir,{recursive:true,force:true}); }
});
test('rejects missing recovery container reference',async()=>{const r=await mutateCheck(async({assets})=>{assets[15].recovery.containerAssetId='MISSING'});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/terminal asset ref MISSING missing/)});
test('rejects missing rebuild source reference',async()=>{const r=await mutateCheck(async({assets})=>{assets.at(-1).rebuild.sourceAssetIds=['MISSING']} );assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/terminal asset ref MISSING missing/)});
test('rejects archive-member without a full file',async()=>{const r=await mutateCheck(async({assets})=>{Object.assign(assets[15],{recordType:'archive-member',source:{containerAssetId:'DOC-REPORT-01',memberPath:'x'},file:{},storageStatus:'rebuildable',rebuild:{sourceAssetIds:['DOC-REPORT-01'],command:'x',expectedOutput:'x'}})});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/archive-member contract incomplete/)});
test('rejects PASS evidence with a nonzero exit code',async()=>{const r=await mutateCheck(async({runs})=>{runs[0].exitCode=7});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/invalid run RUN-REGISTER-01/)});
test('uses a successful superseding run as the active leaf while retaining the failed root',async()=>{
  const r=await mutateCheck(async({assets,runs})=>{
    const root=runs.find(run=>run.runId==='RUN-DOCX-01');
    root.status='FAIL';
    root.exitCode=1;
    appendRunSuccessor({assets,runs});
  });
  assert.equal(r.ok,true,r.summary.errors.join('\n'));
  assert.equal(r.summary.blockingFailureCount,0);
});
test('rejects a supersession edge with a missing target, different gate, changed scope, or non-increasing time',async t=>{
  await t.test('missing target',async()=>{const r=await mutateCheck(async context=>{appendRunSuccessor(context,{supersedesRunId:'RUN-MISSING'})});assert.match(r.summary.errors.join('\n'),/supersedes missing run/)});
  await t.test('different gate',async()=>{const r=await mutateCheck(async context=>{appendRunSuccessor(context,{gateId:'GATE-12.2.5'})});assert.match(r.summary.errors.join('\n'),/supersedes run from a different gate/)});
  await t.test('changed scope',async()=>{const r=await mutateCheck(async context=>{appendRunSuccessor(context,{assetIds:['DOC-REPORT-01']})});assert.match(r.summary.errors.join('\n'),/supersedes run with different assets/)});
  await t.test('non-increasing time',async()=>{const r=await mutateCheck(async context=>{appendRunSuccessor(context,{at:'2026-08-03T23:00:00.000Z'})});assert.match(r.summary.errors.join('\n'),/supersedes run without a later timestamp/)});
});
test('rejects forked and cyclic supersession chains',async t=>{
  await t.test('fork',async()=>{const r=await mutateCheck(async context=>{const {root}=appendRunSuccessor(context);appendRunSuccessor(context,{runId:'RUN-DOCX-03',at:'2026-08-04T02:00:00.000Z',supersedesRunId:root.runId})});assert.match(r.summary.errors.join('\n'),/supersession fork/)});
  await t.test('cycle',async()=>{const r=await mutateCheck(async context=>{const {root,successor}=appendRunSuccessor(context);root.supersedesRunId=successor.runId});assert.match(r.summary.errors.join('\n'),/supersession cycle/)});
});
test('rejects a retry run that is not anchored to a required run chain',async()=>{
  const r=await mutateCheck(async({assets,runs})=>{
    const root=runs.find(run=>run.runId==='RUN-DOCX-01');
    const retry={...root,runId:'RUN-DOCX-02',at:'2026-08-04T01:00:00.000Z',observations:'unanchored retry'};
    runs.push(retry);
    for(const id of retry.assetIds)assets.find(asset=>asset.assetId===id).verificationRefs.push(retry.runId);
  });
  assert.match(r.summary.errors.join('\n'),/unanchored retry run RUN-DOCX-02/);
});
test('keeps a failed active successor blocking while ignoring only the superseded failure',async()=>{
  const r=await mutateCheck(async context=>{const {root,successor}=appendRunSuccessor(context,{status:'FAIL',exitCode:2});root.status='FAIL';root.exitCode=1;successor.observations='retry failed'});
  assert.equal(r.ok,false);
  assert.equal(r.summary.blockingFailureCount,1);
  assert.match(r.summary.errors.join('\n'),/blocking run RUN-DOCX-02/);
  assert.doesNotMatch(r.summary.errors.join('\n'),/blocking run RUN-DOCX-01/);
});
test('returns a stable error summary for a 30-row overlay manifest',async()=>{const r=await mutateCheck(async({dir})=>{const p=path.join(dir,'overlay.json');const rows=JSON.parse(await (await import('node:fs/promises')).readFile(p,'utf8'));await writeFile(p,JSON.stringify(rows.slice(0,30)))});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/overlay manifest unreadable or not 31 entries/)});
test('rejects actual destination-content and copy-verification field drift independently',async()=>{let r=await mutateCheck(async({assets})=>{await writeFile(assets[0].destinationPath,Buffer.from('drift'))});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/actual copy bytes\/hash mismatch/);r=await mutateCheck(async({assets})=>{assets[0].copyVerification.sourceBytes=9});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/policy mismatch DOC-PITCH-01/)});
test('accepts an absolutePath-only normal collection contract in draft',async()=>{const f=await fixture(async({assets})=>assets.push({...assets.at(-1),assetId:'NORMAL-COLLECTION',source:{absolutePath:'C:\\normal'},memberCount:0,memberAssetIds:[],storageStatus:'rebuildable',rebuild:{sourceAssetIds:['DOC-PITCH-01'],command:'x',expectedOutput:'x'}}));f.options.mode='draft';try{const r=await verifyRegister(f.options);assert.doesNotMatch(r.summary.errors.join('\n'),/NORMAL-COLLECTION: collection contract incomplete/)}finally{await rm(f.dir,{recursive:true,force:true})}});
test('rejects missing recovery manifest reference',async()=>{const r=await mutateCheck(async({assets})=>{assets[15].recovery.manifestAssetId='MISSING-MANIFEST'});assert.match(r.summary.errors.join('\n'),/terminal asset ref MISSING-MANIFEST missing/)});
test('rejects required copy run mapped to a wrong gate',async()=>{const r=await mutateCheck(async({runs})=>{runs.find(r=>r.runId==='RUN-COPY-01').gateId='GATE-12.2.1'});assert.match(r.summary.errors.join('\n'),/mapped to wrong gate/)});
test('rejects one-sided verification references',async()=>{const r=await mutateCheck(async({assets})=>{assets[0].verificationRefs=assets[0].verificationRefs.filter(x=>x!=='RUN-REGISTER-01')});assert.match(r.summary.errors.join('\n'),/asset reference is not bidirectional/)});
test('rejects duplicate missing target, hash mismatch, and cycles',async t=>{await t.test('missing',async()=>{const r=await mutateCheck(async({assets})=>{assets[0].storageStatus='duplicate-reference';assets[0].duplicateOf=null});assert.match(r.summary.errors.join('\n'),/duplicateOf required/)});await t.test('hash',async()=>{const r=await mutateCheck(async({assets})=>{assets[1].storageStatus='duplicate-reference';assets[1].duplicateOf=assets[0].assetId;assets[1].file.sha256='B'.repeat(64)});assert.match(r.summary.errors.join('\n'),/duplicate master differs/)});await t.test('cycle',async()=>{const r=await mutateCheck(async({assets})=>{assets[0].storageStatus='duplicate-reference';assets[1].storageStatus='duplicate-reference';assets[0].duplicateOf=assets[1].assetId;assets[1].duplicateOf=assets[0].assetId});assert.match(r.summary.errors.join('\n'),/duplicate cycle/)});});
test('rejects missing overlay collection and each overlay field drift',async t=>{await t.test('collection',async()=>{const r=await mutateCheck(async({assets})=>assets.splice(-1));assert.match(r.summary.errors.join('\n'),/overlay collection missing/)});for(const field of ['relativePath','category','bytes','sha256'])await t.test(field,async()=>{const r=await mutateCheck(async({assets})=>{const a=assets[15];if(field==='bytes')a.file.bytes++;else if(field==='sha256')a.file.sha256='C'.repeat(64);else a.source[field]='drift'});assert.match(r.summary.errors.join('\n'),/overlay member mismatch 1/)});});
test('rejects every invalid image dimension shape',async t=>{for(const dimensions of [{},{height:1},{width:1},{width:0,height:1},{width:-1,height:1},{width:1.5,height:1},{width:'1',height:1}])await t.test(JSON.stringify(dimensions),async()=>{const r=await mutateCheck(async({assets})=>{assets[0].file.mediaType='image/png';assets[0].file.dimensions=dimensions});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/image dimensions are required/)});});
test('rejects every incomplete or invalid risk acceptance field',async t=>{for(const [field,value] of [['approvedBy','agent'],['approvedAt','August 4 2026'],['scope','OTHER'],['reason',''],['residualRisk','']])await t.test(field,async()=>{const r=await mutateCheck(async({assets})=>{const a=assets[15];a.storageStatus='withheld-in-place-risk-accepted';a.riskAcceptance={approvedBy:'user',approvedAt:'2026-08-04T00:00:00.000Z',scope:a.assetId,reason:'r',residualRisk:'risk',[field]:value}});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/risk acceptance invalid/)});});
test('rejects normalized-away ISO dates but accepts real UTC dates',async t=>{for(const value of ['2026-02-31T00:00:00Z','2026-02-29T00:00:00Z'])await t.test(value,async()=>{const r=await mutateCheck(async({assets})=>{const a=assets[15];a.storageStatus='withheld-in-place-risk-accepted';a.riskAcceptance={approvedBy:'user',approvedAt:value,scope:a.assetId,reason:'r',residualRisk:'risk'}});assert.equal(r.ok,false);assert.match(r.summary.errors.join('\n'),/risk acceptance invalid/)});for(const value of ['2026-02-28T00:00:00Z','2026-02-28T00:00:00.000Z'])await t.test(value,async()=>{const r=await mutateCheck(async({assets})=>{const a=assets[15];a.storageStatus='withheld-in-place-risk-accepted';a.riskAcceptance={approvedBy:'user',approvedAt:value,scope:a.assetId,reason:'r',residualRisk:'risk'}});assert.equal(r.ok,true,r.summary.errors.join('\n'))});});
