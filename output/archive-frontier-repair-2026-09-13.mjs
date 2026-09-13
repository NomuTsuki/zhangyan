import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve('.'),hifi='docs/project/evidence/v3-design/validation/workbench-hifi-v0';
const evidence=`${hifi}/verification-frontier-continuity-2026-09-13`,assets='docs/portfolio/2026-09-13-frontier-continuity';
await mkdir(evidence,{recursive:true});await mkdir(assets,{recursive:true});
const entries=[];
async function save(source,target){await copyFile(source,target,constants.COPYFILE_EXCL);const bytes=await readFile(target);entries.push({source,file:target,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
for(const [name,source]of [
 ['model-before.json','output/frontier-repair-before.json'],['model-final.json','output/frontier-repair-model-final.json'],
 ['matrix.json','output/playwright/frontier-system-repair-final-2026-09-13/sweep.json'],
 ['browser-15.json','output/playwright/frontier-system-repair-final-2026-09-13/browser/report.json'],
 ['browser-history-delivery.json','output/playwright/frontier-system-repair-delivery-2026-09-13/browser/report.json'],
 ['browser-material-delivery.json','output/playwright/frontier-system-repair-delivery-2026-09-13/browser-capture/report.json'],
 ['english-browser.json','output/playwright/bilingual-2026-09-13/frontier-complete/report.json'],
 ['english-copy.json','output/playwright/language-audit-2026-09-13/frontier-complete/copy-coverage.json'],
 ['source-browser.json','output/playwright/report-source-2026-09-13/frontier-repair/browser.json'],
 ['source-model.json','output/frontier-repair-source-delivery.json'],
 ['contract.log','output/frontier-repair-contract-delivery.log'],['layout.log','output/frontier-repair-layout.log'],
 ['reveal.log','output/frontier-repair-reveal-first.log'],['build.log','output/frontier-repair-build-delivery.log'],
 ['build-first-failure.log','output/frontier-repair-build-first.log'],
 ...['check-frontier-browser-delivery-2026-09-13.mjs','check-frontier-browser-final-2026-09-13.mjs','check-map-frontiers-final-2026-09-13.mjs'].map(f=>[f+'.txt','output/'+f]),
 ])await save(source,`${evidence}/${name}`);
const final='output/playwright/frontier-system-repair-delivery-2026-09-13/browser-capture';
for(const [name,source]of [
 ['before-material-first.png','output/playwright/frontier-system-audit-2026-09-13/browser/layers-before-material-before.png'],
 ['before-material-second.png','output/playwright/frontier-system-audit-2026-09-13/browser/layers-before-material-after.png'],
 ['material-first.png',`${final}/layers-before-material-before.png`],['material-connecting.png',`${final}/layers-before-material-connect.png`],['material-connected.png',`${final}/layers-before-material-after.png`],
 ['record-endpoint-handover.png','output/playwright/frontier-system-repair-final-2026-09-13/browser/record-to-object-endpoint-connect.png'],
 ['surface-enquiry-connected.png','output/playwright/frontier-system-repair-final-2026-09-13/browser/appearance-to-window-after.png'],
 ['uv-limit-retained.png','output/playwright/frontier-system-repair-final-2026-09-13/browser/uv-to-regional-synthesis-after.png'],
 ['history-source-review.png','output/playwright/frontier-system-repair-delivery-2026-09-13/browser/history-source-review-evidence.png'],
 ['english-overview-1920.png','output/playwright/bilingual-2026-09-13/frontier-complete/2026-09-13-frontier-complete-full-1920.png']
 ])await save(source,`${assets}/2026-09-13-${name}`);
const video=(await readdir(final)).find(f=>f.endsWith('.webm'));
await save(`${final}/${video}`,`${assets}/2026-09-13-material-continuity.webm`);
const mp4=resolve(assets,'2026-09-13-material-continuity.mp4');
execFileSync('D:/anaconda/Library/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-n','-i',resolve(final,video),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-an','-movflags','+faststart',mp4]);
const probe=JSON.parse(execFileSync('D:/anaconda/Library/bin/ffprobe.exe',['-v','error','-show_entries','format=duration:stream=width,height,codec_name','-of','json',mp4],{encoding:'utf8'}));
await writeFile(`${evidence}/video-probe.json`,JSON.stringify(probe,null,2)+'\n',{flag:'wx'});
const product=JSON.parse(await readFile(`${hifi}/build-stamp.json`,'utf8'));
const manifest={generatedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),product,entries,video:probe,
 reviewRequired:true,note:'Each raw browser or matrix report names its own build SHA. The delivery build additionally corrects history-source IDs; full visual tests precede only that metadata fix.'};
await writeFile(`${evidence}/manifest.json`,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({saved:entries.length,product,video:probe}));
