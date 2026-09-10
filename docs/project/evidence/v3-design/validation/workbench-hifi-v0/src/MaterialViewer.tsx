import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createBowlGroup, disposeBowlGroup } from './bowl-art';
import Dialog from './Dialog';
import { cleanCopy } from './engine';
import { materialRecord, type MaterialContext } from './material-records';
import './material-viewer.css';

export type { MaterialContext } from './material-records';

function ObjectPlate({period='current',mode='normal',view='side',caption}:{period?:'current'|'early';mode?:'normal'|'xray';view?:'side'|'base';caption:string}){
  const host=useRef<HTMLDivElement>(null),[error,setError]=useState(false),[zoom,setZoom]=useState(1);
  useEffect(()=>{
    const element=host.current!;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,30),bowl=createBowlGroup({period,mode});
    bowl.rotation.set(view==='base'?-1.56:-.25,-.29,-.105);scene.add(bowl);
    scene.add(new THREE.HemisphereLight(0xfaf0d9,0x474b47,2.8));
    const key=new THREE.DirectionalLight(0xffffff,3.4);key.position.set(-3,4,5);scene.add(key);
    const fill=new THREE.DirectionalLight(0xbccbd0,1.2);fill.position.set(3,1,3);scene.add(fill);
    camera.position.set(0,.1,view==='base'?4.15/zoom:4.55/zoom);camera.lookAt(0,-.03,0);
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',caption);element.append(renderer.domElement);
    const draw=()=>{const r=element.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.render(scene,camera);};
    const resize=new ResizeObserver(draw);resize.observe(element);draw();
    return()=>{resize.disconnect();disposeBowlGroup(bowl);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[period,mode,view,zoom]);
  return <figure className={`object-plate ${period==='early'?'historic-plate':''} ${mode==='xray'?'xray-plate':''}`}><div ref={host} className="plate-canvas">{error&&<p>本次材料图像未能显示，文字记录仍可回看。</p>}</div><figcaption>{caption}<button onClick={()=>setZoom(v=>v===1?1.28:1)} aria-label="放大或恢复材料图像">{zoom===1?'＋ 放大':'− 恢复'}</button></figcaption></figure>;
}

export default function MaterialViewer({observationId,graph,context,onClose}:{observationId:string;graph:any;context?:MaterialContext|null;onClose:()=>void}){
  const [activeId,setActiveId]=useState(observationId);
  const [view,setView]=useState<'side'|'base'>('side');
  const [showImage,setShowImage]=useState(false);
  useEffect(()=>{setActiveId(observationId);setShowImage(false);setView('side');},[observationId]);
  const record=materialRecord(graph,activeId,context);
  if(!record)return null;
  const {observation}=record;
  const navigate=(id:string)=>{setActiveId(id);setShowImage(false);setView('side');};
  const photo=activeId==='obs.phase.t1';
  const verification=activeId==='obs.object.continuity';
  const base=activeId==='obs.current.base';
  const xray=activeId==='obs.structure.xray.early';
  const comparison=activeId.includes('cross-time');
  const documentedComparison=activeId.includes('documented');
  const accidentAttributed=graph.observations.some((o:any)=>o.id==='obs.archive.t2.object-attribution');
  const archive=activeId.startsWith('obs.accident')||activeId.startsWith('obs.phase.t3')||activeId.startsWith('obs.archive');
  const current=base||activeId==='obs.current.whole'||activeId==='obs.appearance.restore';
  const hasImage=verification||photo||current||comparison||xray;
  const entryTitle=graph.observations.find((o:any)=>o.id===observationId)?.title;
  return <Dialog title={observation.title} onClose={onClose} wide>
    <article className="material-reader" data-observation-id={activeId} data-context-id={context?.id}>
    {context&&<div className="material-context"><span>{context.kind==='claim'?'正在回看这项判断':'从这里回看材料'}</span><strong>{context.title}</strong>{record.contextState&&<small>{record.contextState}</small>}</div>}
    {activeId!==observationId&&<button className="material-return" onClick={()=>navigate(observationId)}>← 返回「{entryTitle}」</button>}
    <div className="material-meta"><span>{observation.actionName||'调查留存'} · 第 {observation.steps?.[0]||observation.firstSeen||'—'} 次调查</span><span>已有材料</span></div>
    <div className="material-readings-grid">
      <section className="material-result"><h3>这次看到了什么</h3><p>{record.result}</p><div className="material-scope"><span>观察范围</span><strong>{record.scope}</strong></div></section>
      <section className="material-use"><h3>{context?.kind==='claim'?'对这项判断能说明什么':'这份材料能用于什么'}</h3><p>{record.role}</p></section>
    </div>
    <section className="material-boundary"><h3>还不能据此判断什么</h3><p>{record.limit}</p>{record.pending.length>0&&<ul className="material-pending">{record.pending.map(text=><li key={text}>{text}</li>)}</ul>}</section>
    {record.archiveRelations.length>0&&<section className="material-checks"><h3>这组记录的三项核验</h3><dl>{record.archiveRelations.map((relation:any)=><div key={relation.key} data-relation={relation.key}><dt>{relation.title}</dt><dd className={relation.status==='established'?'is-established':''}>{relation.status==='established'?'已核实':relation.status==='contested'?'存在冲突':'尚未核实'}</dd></div>)}</dl><p>一项核验成立，不会自动替另两项作结论。</p></section>}
    {record.inputs.length>0&&<section className="material-inputs"><h3>{verification?'这次核验用到的材料':'这次比较用到的材料'}</h3><p>下面列出报告实际使用的材料；材料输入本身不等于判断已成立。</p><div>{record.inputs.map(input=><button key={input.id} onClick={()=>navigate(input.id)} data-material-source={input.id}><span>{input.title}<small>{input.role}</small></span><span>回看 →</span></button>)}</div></section>}
    <section className="material-visuals">
    <button className="material-image-toggle" aria-expanded={showImage} onClick={()=>setShowImage(value=>!value)}>{showImage?'收起':'展开'}{hasImage?'器物与材料示意':'原记录摘录'}<span>{hasImage?'辅助定位观察范围':'回查原始摘要'} {showImage?'−':'＋'}</span></button>
    {showImage&&<div className="material-image-body">
    {hasImage&&<p className="material-image-note">图像用于定位与对照，是本案例的器物复原和结构示意。尚未提供可逐项核对的特征值与原始照片；请以本次记录的观察范围为限。</p>}
    {(verification||photo||current||comparison)&&<div className="material-toolbar"><span>查看角度</span><button className={view==='side'?'selected':''} onClick={()=>setView('side')}>器形与纹饰</button><button className={view==='base'?'selected':''} onClick={()=>setView('base')}>底足位置</button></div>}
    {verification?<div className="material-pair"><ObjectPlate period="early" view={view} caption="旧照片中的器物"/><ObjectPlate view={view} caption="眼前这只碗"/></div>:
      photo?<ObjectPlate period="early" view={view} caption="较早时点的器物影像 · 19 世纪末"/>:
      xray?<ObjectPlate mode="xray" caption="当前内部成像 · 可读区域的结构示意"/>:
      comparison?<div className="material-pair">{documentedComparison?<div className="archival-leaf"><span>事故记录摘录</span><h3>损坏与重组</h3><p>这组记录记述严重损坏与重组。</p><p>{accidentAttributed?'已核实这组记录属于眼前这只碗。':'记录与眼前器物是否相属，需要另行核实。'}</p></div>:<ObjectPlate period="early" view={view} caption="旧照片所显示的区域"/>}<ObjectPlate view={view} caption="现器的对应可见区域"/></div>:
      archive?<div className="archival-leaf"><span>档案留存 · 摘录</span><h3>{observation.title}</h3><p>{cleanCopy(observation.summary)}</p><div className="archival-rule"/><p className="document-note">记录自身的内容、记录指向哪只器物，以及记载的事件是否得到实物印证，分别保留核验结果。</p></div>:
      current?<ObjectPlate view={base?'base':view} caption={base?'现器底足 · 观察部位示意':'现器的形制与可见修补'}/>:
      <div className="report-leaf"><span className="report-glyph">录</span><h3>{observation.title}</h3><p>{cleanCopy(observation.summary)}</p>{observation.coverage&&<p className="report-scope">这份记录的解释范围，以本次实际查看的部位和手段为限。</p>}</div>}
    </div>}
    </section>
    <footer className="material-record-footer"><span>本次记录保留原调查次数与来源，回看不消耗调查机会。</span><span data-source-ids={record.originalSourceIds.join(' ')}>{record.originalSourceIds.length} 项原始来源</span></footer>
    </article>
  </Dialog>;
}
