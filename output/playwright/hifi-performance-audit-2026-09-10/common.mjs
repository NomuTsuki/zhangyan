/* review required: read-only diagnostic runner; native game actions, no game state replacement. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ACTIONS} from '../../../docs/project/evidence/v3-design/validation/workbench-map-fusion-v0/local-case.mjs';
const require=createRequire(import.meta.url);
export const {chromium}=require('C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright');
export const base=resolve('docs/project/evidence/v3-design/validation/workbench-hifi-v0');
export const out=resolve('output/playwright/hifi-performance-audit-2026-09-10');
export const sha256=createHash('sha256').update(readFileSync(resolve(base,'prototype.html'))).digest('hex');
export const A={W:'A.OBSERVE.WHOLE',B:'A.OBSERVE.BASE',P:'A.LOCATE.HISTORIC_IMAGE',C:'A.VERIFY.OBJECT_CONTINUITY',X:'A.IMAGE.XRAY',T2:'A.RESEARCH.ACCIDENT',ATTR:'A.RELATE.ARCHIVE.T2_TO_OBJECT',CORR:'A.CORROBORATE.ARCHIVE.T2_CURRENT',D:'A.MAP.REGION_CONTINUITY',POINT:'A.INSPECT.WINDOWS',SURF:'A.SYNTHESIZE.SURFACE_REGIONS'};
export const mainRoute=[A.W,A.B,A.P,A.C,A.T2,A.ATTR,A.CORR,'A.RESEARCH.LATE_TREATMENT','A.RELATE.ARCHIVE.T3_TO_OBJECT',A.X,A.POINT,'A.CORROBORATE.ARCHIVE.T3_CURRENT',A.SURF,'A.ANALYZE.MATERIAL.SUBSTRATE','A.INSPECT.MATERIAL.LAYER_SEQUENCE','A.ASSESS.TREATED_AND_UNTREATED','A.TRACE.PROVENANCE_CHAIN'];
export const remaining=['A.SCREEN.UV','A.OBSERVE.REGION_DECOR','A.COMPARE.CORPUS','A.COMPARE.CORPUS.RECHECK',A.D];
const actions=new Map(ACTIONS.map(a=>[a.id,a])),body={OBJ_W:'整只碗',OBJ_F:'底足与修足',OBJ_D:'纹饰与色差',OBJ_R:'没被改动的特征',SURF:'表面'};
export async function start(browser,{reduced=false,width=1440,url}={}){const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:reduced?'reduce':'no-preference'});page.errors=[];page.on('pageerror',e=>page.errors.push(e.message));await page.goto(url||pathToFileURL(resolve(base,'prototype.html')).href);await page.waitForFunction(()=>window.hifiSnapshot?.().visibleBody.includes('OBJ_R'));return page;}
export async function prepare(page,id,basis){const close=page.getByRole('button',{name:'关闭手段',exact:true});if(await close.count())await close.click();const p=actions.get(id).place;if(body[p]){await page.locator('.bowl-webgl').focus();await page.keyboard.press('Home');if(p==='OBJ_F')for(let i=0;i<11;i++)await page.keyboard.press('ArrowUp');await page.waitForFunction(p=>window.hifiSnapshot().visibleBody.includes(p),p);await page.locator('.bowl-target-list').getByRole('button',{name:body[p],exact:true}).click();}else await page.locator(`[data-place="${p}"]`).click();const row=page.locator(`[data-action-row="${id}"]`);if(basis)await row.locator(`input[value="${basis}"]`).check();return row.locator(`[data-action="${id}"]`);}
export async function take(page,id,basis){await(await prepare(page,id,basis)).click();await page.waitForFunction(id=>window.hifiSnapshot().session.log.at(-1)?.actionId===id,id);}
export async function idle(page){await page.waitForFunction(()=>document.querySelector('.map-component').dataset.phase==='idle',null,{timeout:30000});}
export async function motion(page,reduced){await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('dialog').getByRole('checkbox').setChecked(reduced);await page.keyboard.press('Escape');}
