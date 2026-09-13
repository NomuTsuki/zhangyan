import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),base=resolve('docs/project/evidence/v3-design/validation/workbench-hifi-v0'),dest=resolve(base,'verification-report-source-2026-09-13');
await mkdir(dest,{recursive:true});const json=async p=>JSON.parse(await readFile(p,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const build=await json(resolve(base,'build-stamp.json'));assert.equal(hash(await readFile(resolve(base,'prototype.html'))),build.sha256);
const files=[
 ['output/report-source-before.json','model-before.json'],['output/report-source-first.json','initial-syntax-failure.txt'],
 ['output/report-source-final.json','model-final.json'],['output/report-source-layout.json','fixed-layout-original.json'],
 ['output/report-source-reveal.json','reveal-original.jsonl'],['output/report-source-contract.json','contract-summary.json'],
 ['output/report-source-build-second.log','build.log'],
 ['output/playwright/report-source-2026-09-13/first/browser.json','browser-first.json'],
 ['output/playwright/report-source-2026-09-13/second/browser.json','browser-six.json'],
 ['output/playwright/report-source-2026-09-13/interrupt/browser.json','browser-interruption.json'],
 ['output/playwright/report-source-2026-09-13/capture/browser.json','browser-capture.json'],
 ['output/playwright/report-source-2026-09-13/pair/evidence.json','pair-evidence.json'],
 ['output/playwright/bilingual-2026-09-13/report-source/report.json','bilingual-six.json'],
 ['output/playwright/language-audit-2026-09-13/report-source/browser.json','language-nine.json'],
 ['output/playwright/language-audit-2026-09-13/report-source/copy-coverage.json','copy-coverage.json'],
];
for(const [source,name] of files)await copyFile(resolve(root,source),resolve(dest,name),constants.COPYFILE_EXCL);
await copyFile(resolve(base,'verification-contract.json'),resolve(dest,'contract-report.json'),constants.COPYFILE_EXCL);
await copyFile(resolve(base,'build-stamp.json'),resolve(dest,'build-stamp.json'),constants.COPYFILE_EXCL);
const finalFiles=['browser-six.json','browser-interruption.json','browser-capture.json','bilingual-six.json','language-nine.json'];
for(const name of finalFiles){const r=await json(resolve(dest,name));assert.equal(r.sha256,build.sha256);assert.ok(r.passed);}
const model=await json(resolve(dest,'model-final.json')),copy=await json(resolve(dest,'copy-coverage.json'));assert.ok(model.passed);assert.ok(copy.passed);
const video=resolve('docs/portfolio/2026-09-13-report-source-continuity/2026-09-13-source-continuity-normal-speed.mp4');
const videoInfo=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=width,height,codec_name','-of','json',video],{encoding:'utf8'}));
await writeFile(resolve(dest,'summary.json'),JSON.stringify({reviewRequired:true,checkpoint:'2e5dafce87bbfd1cd36e1f72ce8bfda36fb4365f',build,
 modelChecks:model.results.length,browserChecks:6+1,originalContractChecks:7,originalLayoutChecks:8,originalRevealChecks:5,
 bilingualChecks:6,languageBranches:9,copy:{orders:copy.orders,uniqueStates:copy.uniqueStates,uniqueDisplayStrings:copy.uniqueDisplayStrings,missing:copy.missing.length},videoInfo,
 provenance:'Implementation owner: real Edge UI, read-only snapshots, screenshot inspection, video contact sheet; no independent or human acceptance.'},null,2));
const sums=[];for(const file of await readdir(dest)){const b=await readFile(resolve(dest,file));sums.push({file,bytes:b.length,sha256:hash(b)});}
await writeFile(resolve(dest,'SHA256SUMS.json'),JSON.stringify(sums,null,2));
const assets=resolve('docs/portfolio/2026-09-13-report-source-continuity'),items=[];
for(const file of await readdir(assets)){if(!/\.(png|mp4|webm)$/.test(file))continue;const b=await readFile(resolve(assets,file));items.push({file,bytes:b.length,sha256:hash(b),...(file.endsWith('.png')?{width:b.readUInt32BE(16),height:b.readUInt32BE(20)}:{}),status:file.includes('first-')?'Intermediate: before camera correction':file.includes('before-same')?'Before: checkpoint 2e5dafc':'Verified capture / working take; see README'});}
await writeFile(resolve(assets,'assets.json'),JSON.stringify({candidateSpreadSlots:['System','Process','Reflection'],build:build.sha256,videoInfo,assets:items},null,2));
console.log(JSON.stringify({artifact:build.sha256,archived:sums.length,assets:items.length,model:6,browser:7,oldChecks:'7 + 8 + 5 + 6 + 9',video:videoInfo.format.duration}));
