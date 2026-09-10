import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {out} from './common.mjs';
const profile=JSON.parse(await readFile(resolve(out,'targeted-dev/provenance.cpuprofile'),'utf8'));
const byId=new Map(profile.nodes.map(n=>[n.id,n])),parents=new Map(),self=new Map();for(const n of profile.nodes)for(const id of n.children||[])parents.set(id,n.id);
for(let i=0;i<profile.samples.length;i++){const id=profile.samples[i];self.set(id,(self.get(id)||0)+profile.timeDeltas[i]/1000);}
const inc=id=>(self.get(id)||0)+(byId.get(id).children||[]).reduce((n,c)=>n+inc(c),0);
const describe=n=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,selfMs:self.get(n.id)||0,inclusiveMs:inc(n.id)});
const hot=profile.nodes.filter(n=>n.callFrame.url?.includes('solver.mjs')||['routeHitPath','placeMapLabels','layoutMap','paint'].includes(n.callFrame.functionName)).map(describe).filter(n=>n.inclusiveMs>8).sort((a,b)=>b.inclusiveMs-a.inclusiveMs);
const validation=profile.nodes.filter(n=>n.callFrame.functionName==='solveOrderIndependentFactors').map(n=>{const chain=[];let id=n.id;while(id){chain.push(describe(byId.get(id)));id=parents.get(id);}return chain;});
const timing=[];for(const name of ['01-first-xray','02-photo-after-xray','03-continuity-four-known']){const a=JSON.parse(await readFile(resolve(out,'baseline',name+'-raw.json'),'utf8'));timing.push({name,firstAfterClick:a.visual.find(f=>f.t>=a.click),nodeReveals:[...new Set(a.visual.flatMap(f=>f.nodes.map(n=>n.id)))].map(id=>({id,firstVisibleMs:(a.visual.find(f=>f.t>=a.click&&f.nodes.some(n=>n.id===id&&+n.opacity>0))?.t||NaN)-a.click}))});}
const result={generatedAt:new Date().toISOString(),profileFile:'targeted-dev/provenance.cpuprofile',hot,validationCallChains:validation,timing};await writeFile(resolve(out,'analysis.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({hot:hot.slice(0,15),validationCallChains:validation.map(a=>a.map(n=>n.name)),reveals:timing.map(({name,nodeReveals})=>({name,nodeReveals}))}));
