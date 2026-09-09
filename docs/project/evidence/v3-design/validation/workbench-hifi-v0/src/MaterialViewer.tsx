import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createBowlGroup, disposeBowlGroup } from './bowl-art';
import Dialog from './Dialog';
import { cleanCopy } from './engine';

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

export default function MaterialViewer({observationId,graph,onClose}:{observationId:string;graph:any;onClose:()=>void}){
  const observation=graph.observations.find((o:any)=>o.id===observationId);
  const [view,setView]=useState<'side'|'base'>('side');
  if(!observation)return null;
  const verified=graph.observations.some((o:any)=>o.id==='obs.object.continuity');
  const photo=observationId==='obs.phase.t1';
  const verification=observationId==='obs.object.continuity';
  const base=observationId==='obs.current.base';
  const xray=observationId==='obs.structure.xray.early';
  const comparison=observationId.includes('cross-time');
  const documentedComparison=observationId.includes('documented');
  const accidentAttributed=graph.observations.some((o:any)=>o.id==='obs.archive.t2.object-attribution');
  const archive=observationId.startsWith('obs.accident')||observationId.startsWith('obs.phase.t3')||observationId.startsWith('obs.archive');
  const current=base||observationId==='obs.current.whole'||observationId==='obs.current.decor';
  return <Dialog title={observation.title} onClose={onClose} wide>
    <div className="material-meta"><span>{observation.actionName||'调查留存'} · 第 {observation.steps?.[0]||observation.firstSeen||'—'} 次调查</span><span>已有材料</span></div>
    {(verification||photo||current||comparison)&&<div className="material-toolbar"><span>查看角度</span><button className={view==='side'?'selected':''} onClick={()=>setView('side')}>器形与纹饰</button><button className={view==='base'?'selected':''} onClick={()=>setView('base')}>底足与锔痕</button></div>}
    {verification?<div className="material-pair"><ObjectPlate period="early" view={view} caption="旧照片中的器物"/><ObjectPlate view={view} caption="眼前这只碗"/></div>:
      photo?<ObjectPlate period="early" view={view} caption="较早时点的器物影像 · 19 世纪末"/>:
      xray?<ObjectPlate mode="xray" caption="当前内部成像 · 可读区域的结构示意"/>:
      comparison?<div className="material-pair">{documentedComparison?<div className="archival-leaf"><span>事故记录摘录</span><h3>损坏与重新拼合</h3><p>记录记述器物受到严重损坏，原片被重新组合，缺处进行补配。</p><p>{accidentAttributed?'已核实这组记录属于眼前这只碗。':'记录与眼前器物是否相属，需要另行核实。'}</p></div>:<ObjectPlate period="early" view={view} caption="旧照片所显示的区域"/>}<ObjectPlate view={view} caption="现器的对应可见区域"/></div>:
      archive?<div className="archival-leaf"><span>档案留存 · 摘录</span><h3>{observation.title}</h3><p>{cleanCopy(observation.summary)}</p><div className="archival-rule"/><p className="document-note">记录自身的内容、记录指向哪只器物，以及记载的事件是否得到实物印证，分别保留核验结果。</p></div>:
      current?<ObjectPlate view={base?'base':view} caption={base?'现器底足 · 修削面、足沿与旧锔痕':'现器的形制与可见修补'}/>:
      <div className="report-leaf"><span className="report-glyph">录</span><h3>{observation.title}</h3><p>{cleanCopy(observation.summary)}</p>{observation.coverage&&<p className="report-scope">这份记录的解释范围，以本次实际查看的部位和手段为限。</p>}</div>}
    <div className="material-reading"><h3>{verification?'这次核验说明什么':photo?'这张影像现在能说明什么':xray?'读数的边界':'观察记录'}</h3>
      <p>{verification?'旧照与现器的足部特征及旧锔痕位置核验相符，可以把旧照片中的早期状态归入这只碗的历史。核验没有给今天所有内部接合确定年代。':
        photo?(verified?'照片中的器物已与现器核验相符。至迟在拍摄时，这只碗已经留有锔修痕迹。':'影像中已经能看见旧锔痕。这些痕迹属于照片中的器物；是否就是眼前这只碗，仍需核对。'):
        xray?'它记录今天可读区域内的接合、填料候选与瓷片边界。仅凭当前结构，不能确定这些接合何时形成，也不能证明过去未出现过某条接缝。':cleanCopy(observation.summary)}</p>
      {comparison&&<p>{documentedComparison?'比较报告保留当时选定的事故记录与现器材料。记录归属核实后，这份报告可用于说明记载事件与现物的对应。':'比较报告保留当时选定的材料。只有对象归属得到核实之后，报告才能用于说明本器在相应时点发生的变化。'}</p>}
      <small className="material-reconstruction">影像为本虚构案例的器物复原与结构示意。</small>
    </div>
  </Dialog>;
}
