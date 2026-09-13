import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
const base='docs/project/evidence/v3-design/validation/workbench-hifi-v0';
const source='output/playwright/node-label-repair-2026-09-13';
const evidence=base+'/verification-node-labels-2026-09-13';
const portfolio='docs/portfolio/2026-09-13-node-labels';
await mkdir(evidence,{recursive:true});await mkdir(portfolio,{recursive:true});
const saved=[];
async function preserve(src,dest){await copyFile(src,dest,constants.COPYFILE_EXCL);saved.push({path:dest,sha256:createHash('sha256').update(await readFile(dest)).digest('hex')});}
for(const name of ['before','first','second','third','delivery','verified','before-matched','matched'])await preserve(`${source}/${name}-results.json`,`${evidence}/${name}-results.json`);
for(const name of ['node-label-build-fourth','node-label-final-contract','node-label-final-layout','node-label-final-reveal','node-label-frontier','node-label-language-copy','node-label-report-browser','node-label-browser-verified','node-label-matched-0','node-label-matched-1'])await preserve(`output/${name}.log`,`${evidence}/${name}.log`);
for(const language of ['zh','en']){
 for(const [from,to] of [['before-matched','before'],['matched','after']])await preserve(`${source}/${from}-${language}-upper-map.png`,`${portfolio}/2026-09-13-${to}-${language}-upper-map.png`);
 await preserve(`${source}/matched-${language}-overview.png`,`${portfolio}/2026-09-13-after-${language}-overview.png`);
}
await preserve(`${source}/second-en-upper-map.png`,`${portfolio}/2026-09-13-process-english-labels-still-remote.png`);
await writeFile(`${evidence}/manifest.json`,JSON.stringify({artifact:JSON.parse(await readFile(`${base}/build-stamp.json`,'utf8')),files:saved},null,2),{flag:'wx'});
await writeFile(`${evidence}/README.md`,[
 '# 节点名称修正运行证据','',
 '当前构建4d6362a8；报告见上一级VERIFICATION-NODE-LABELS-2026-09-13.md。所有文件是命令执行或真实浏览器输出的副本，SHA-256见manifest.json。','',
 '- before-results.json：原11ea710e，首次93项断言中34项失败。',
 '- first / second / third-results.json：英文标签仍远离的迭代，失败保留。',
 '- delivery-results.json：新增SVG独立检查忽略遮罩导致的脚本误报；产品未为此改动。',
 '- verified-results.json：DPR1，134/134断言通过。',
 '- before-matched / matched-results.json：DPR2同尺寸画面重放；原版117项中34项失败，修订版134/134通过。旧版无报告短名，所以无法执行新增短名的16项交互检查；没有伪记通过。',
 '- matched上段截图固定相机原点(24,16)，先缩至20%再放大9次，缩放比例完全相同；3840×2160原生截图，非放大旧图。',
 '- 原检查点HTML与4份呈现源码保留在仓库output/playwright/node-label-repair-2026-09-13/before-*。',
 '- 规则7、旧布局8、生命周期5、前沿14；来源浏览器7；58顺序1069状态409条文案，具体范围见各命令输出。',
 '', '新增测试与具体呈现默认值：review required。执行者自检，不是独立审查或真人体验通过。',''
 ].join('\n'),{flag:'wx'});
await writeFile(`${portfolio}/README.md`,[
 '# Node names and consistent information markers','',
 'Candidate spread slot: process / refinement. 桌面1920×1080，DPR2原生3840×2160；前后上段视口、相机原点和70.36%缩放一致。局部视图裁切右侧远端文字，可平移查看；全览图用于展示结构。过程失败图为DPR1。','',
 'Before: 11ea710e. After: 4d6362a8. Same 22 enquiries, with the photograph comparison last. No rules, node coordinates or road geometry changed.','',
 '- [Before, Chinese](2026-09-13-before-zh-upper-map.png) / [After, Chinese](2026-09-13-after-zh-upper-map.png): Bringing names back to their evidence · dense roads displaced captions · local reflow restores readable ownership.',
 '- [Before, English](2026-09-13-before-en-upper-map.png) / [After, English](2026-09-13-after-en-upper-map.png): The same map in English · long words resisted narrow spaces · concise labels and measured type retain the fixed roads.',
 '- [English overview](2026-09-13-after-en-overview.png) / [Chinese overview](2026-09-13-after-zh-overview.png): One acquired-information symbol family · reports become part of roads · visible names keep every report traceable.',
 '- [Intermediate failure](2026-09-13-process-english-labels-still-remote.png): Measurement alone was insufficient · long labels still wandered · preserved before adding edge space and concise names.',
 '', 'Static legibility refinement; no new promotional clip. Existing source-transition regression captured a normal-speed clip separately, and the prior approved demonstration video was not edited. Human readability remains pending.',''
 ].join('\n'),{flag:'wx'});
const updates=[
 ['docs/project/02-CURRENT-STATE.md','# Current State\n',`\n## 2026-09-13 当前：节点名称与符号辨识修正\n\n已按用户批准修正名称远离、报告小圆点无短名、图注圆形不符和道路对比偏弱。当前高保真页为4d6362a8；节点与道路固定位置、调查与判定规则不变。报告继续共用已有信息图注。中英24组渲染状态／134项断言通过，正常来源与恢复7组通过；真人易读性待反馈。\n\n[实现与核验](evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-NODE-LABELS-2026-09-13.md)、[三分钟复测](evidence/v3-design/validation/workbench-hifi-v0/PLAYTEST-NODE-LABELS.md)、[同尺寸前后图](../portfolio/2026-09-13-node-labels/README.md)。新增测试与呈现默认值review required。所有修正仍在工作区，未提交／推送；本地检查点2e5dafc保留。下列记录仅描述各自历史构建。\n`],
 ['docs/project/03-NEXT-ACTIONS.md','# Next Actions\n',`\n## 2026-09-13 当前：复测名称归属、圆点与线条辨识\n\n使用[当前高保真页](evidence/v3-design/validation/workbench-hifi-v0/prototype.html)4d6362a8，按[短复测](evidence/v3-design/validation/workbench-hifi-v0/PLAYTEST-NODE-LABELS.md)观察节点能否直接找到名称、报告点与短名联动是否清楚、绿线和灰黑线是否更易区分。机器与截图证据见[验证报告](evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-NODE-LABELS-2026-09-13.md)。不扩玩法；本轮未提交／推送，新增呈现检查review required，真人体验待用户评价。\n`],
 [base+'/README.md','# 掌眼 · 高保真工作台 v0\n',`\n**2026-09-13 名称与符号修正：** 当前页4d6362a8修正名称远离、报告短名、圆点大小与图注一致性，并轻微加深道路区分。中英24组实际渲染状态／134项断言与来源恢复7组通过，体验待真人反馈；未提交／推送。[验证](VERIFICATION-NODE-LABELS-2026-09-13.md) · [短复测](PLAYTEST-NODE-LABELS.md) · [同尺寸对照](../../../../../portfolio/2026-09-13-node-labels/README.md)。下文按历史构建保留。\n`],
 ['docs/project/delivery/README.md','# 掌眼 V3 阶段成果\n',`\n9月13日节点名称修订：当前页4d6362a8已修正名称远离、报告短名、图注和道路对比。[实现与核验](../evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-NODE-LABELS-2026-09-13.md)及[短复测](../evidence/v3-design/validation/workbench-hifi-v0/PLAYTEST-NODE-LABELS.md)。未提交／推送，真人易读性待反馈；下文为历史。\n`]
];
for(const [file,heading,text]of updates){const content=await readFile(file,'utf8');if(!content.startsWith(heading))throw Error(file+' heading mismatch');await writeFile(file,heading+text+content.slice(heading.length),'utf8');}
let readme=await readFile('README.md','utf8');readme=readme.replace('其后的来源道路及整图前沿接续修订（当前页 `11ea710e`）','其后的来源道路、整图前沿及节点名称修订（当前页 `4d6362a8`）');await writeFile('README.md',readme,'utf8');
await writeFile('docs/project/PARAMS.md',(await readFile('docs/project/PARAMS.md','utf8'))+`\n## 2026-09-13 名称与节点辨识\n\nid: v3.hifi.node-label-legibility\nvalue & unit: 报告圆点14→17世界像素，普通圆点20不变；绿线#687e4e→#5d7645，对应线#5e625c→#62615d，调查联系#7d8276→#74736e；非相关道路不透明度0.42→0.52；边缘文字可使用道路世界左右各264像素空间。\nidentity: experimental-default，用户批准轻微改善尺寸、对比与名称归属。\nwhy: 报告仍是已取得信息；降低与普通点的尺寸落差，保留同一种圆环内芯；实际字体测量和局部换行让文字靠近所属信息，避免把道路挤动。\naffects: 报告标记辨识、道路区分、文字行数／位置与取景文字范围。\ndoes NOT affect: 字号、节点坐标、曲线控制点、证据／动作／费用、阶段与判断。\nstatus: experimental；134项浏览器断言与有限实际场景通过，未据此宣称真人易读性通过；具体见VERIFICATION-NODE-LABELS-2026-09-13.md。\nreopen when: 用户仍无法分辨名称归属、报告符号或线条类型，或认为对比过强、边缘文字过散；按原11ea710e对照回调呈现值，不更改推理语义。\n`,'utf8');
console.log(JSON.stringify({files:saved.length,artifact:'4d6362a8',evidence:resolve(evidence),portfolio:resolve(portfolio)}));
