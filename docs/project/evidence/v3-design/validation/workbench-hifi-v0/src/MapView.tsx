import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { layoutMap, placeMapLabels } from './map-layout.mjs';
import type { Investigation, Selection } from './engine';

type Camera={x:number;y:number;s:number};
type Phase='idle'|'fly'|'focus'|'connect';
type Props={graph:any;focus:any;selection:Selection;onSelect:(selection:Selection)=>void;onHover:(selection:Selection)=>void;
  investigation:Investigation;cancelEpoch:number;reducedMotion:boolean;historyMode:boolean;notice:string;latestTitle:string;onOpenLatest?:()=>void};
declare global {interface Window {hifiMapSnapshot?:()=>any;}}
const ease=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const visibleBounds=(p:any)=>{
  const halfW=p.box?.w/2||14,halfH=p.box?.h/2||14;
  const label=p.labelBounds;
  return {
    left:Math.min(p.x-halfW,label?.x??p.x),right:Math.max(p.x+halfW,label?label.x+label.width:p.x),
    top:Math.min(p.y-halfH,label?.y??p.y),bottom:Math.max(p.y+halfH,label?label.y+label.height:p.y),
  };
};

export default function MapView(props:Props){
  const {graph,focus,selection,onSelect,onHover,investigation,cancelEpoch,reducedMotion,historyMode}=props;
  const viewport=useRef<HTMLDivElement>(null),world=useRef<HTMLDivElement>(null),previous=useRef<any>(null);
  const base=useMemo(()=>layoutMap(graph,historyMode?null:previous.current),[graph,historyMode]);
  const [measured,setMeasured]=useState<{base:any;layout:any}|null>(null);
  const layout:any=measured&&measured.base===base?measured.layout:base;
  const layoutRef=useRef<any>(layout);layoutRef.current=layout;
  const [camera,setCameraState]=useState<Camera>({x:0,y:0,s:1}),cam=useRef(camera);
  const [phase,setPhase]=useState<Phase>('idle'),[fresh,setFresh]=useState<any>(null);
  const [flight,setFlight]=useState<{d:string;x:number;y:number;key:number}|null>(null);
  const [legend,setLegend]=useState(false),[dragging,setDragging]=useState(false);
  const raf=useRef(0),timers=useRef<number[]>([]),token=useRef(0),lastEvent=useRef<number|null>(null),initial=useRef(false);
  const drag=useRef<{x:number;y:number;camera:Camera;moved:boolean;pointerId:number}|null>(null);
  const setCamera=(v:Camera)=>{cam.current=v;setCameraState(v);};
  const stopAnimation=()=>{token.current++;cancelAnimationFrame(raf.current);timers.current.forEach(clearTimeout);timers.current=[];setFlight(null);setPhase('idle');setFresh(null);};
  const later=(fn:()=>void,delay:number,run:number)=>{timers.current.push(window.setTimeout(()=>{if(token.current===run)fn();},delay));};
  function moveCamera(next:Camera,duration:number,run:number){
    cancelAnimationFrame(raf.current);const from={...cam.current},start=performance.now();
    const frame=(now:number)=>{if(run!==token.current)return;const t=Math.min(1,(now-start)/duration),f=ease(t);setCamera({x:from.x+(next.x-from.x)*f,y:from.y+(next.y-from.y)*f,s:from.s+(next.s-from.s)*f});if(t<1)raf.current=requestAnimationFrame(frame);};
    raf.current=requestAnimationFrame(frame);
  }
  function centered(p:{x:number;y:number},scale:number):Camera{const r=viewport.current!.getBoundingClientRect();return{x:r.width*.5-p.x*scale,y:r.height*.45-p.y*scale,s:scale};}
  function fit(points:any[],minimum=.5,maximum=1.06):Camera{
    const r=viewport.current!.getBoundingClientRect();if(!points.length)return{x:r.width/2-layout.width/2,y:50,s:1};
    const bounds=points.map(visibleBounds);
    const minX=Math.min(...bounds.map(b=>b.left)),maxX=Math.max(...bounds.map(b=>b.right));
    const minY=Math.min(...bounds.map(b=>b.top)),maxY=Math.max(...bounds.map(b=>b.bottom));
    const scale=clamp(Math.min((r.width-110)/Math.max(130,maxX-minX),(r.height-110)/Math.max(130,maxY-minY)),minimum,maximum);
    return {x:r.width/2-(minX+maxX)/2*scale,y:r.height*.46-(minY+maxY)/2*scale,s:scale};
  }
  useLayoutEffect(()=>{
    if(!world.current)return;
    const measurements:Record<string,{width:number;height:number}>={};
    world.current.querySelectorAll<HTMLElement>('[data-map-label]').forEach(el=>{measurements[el.dataset.mapLabel!]={width:el.offsetWidth,height:el.offsetHeight};});
    const next=placeMapLabels(base,measurements,base);setMeasured({base,layout:next});if(!historyMode)previous.current=next;
  },[base,historyMode]);

  useEffect(()=>{
    if(!viewport.current)return;
    if(!initial.current){setCamera(fit(layout.nodes, .75,1));initial.current=true;}
  },[layout]);
  useEffect(()=>{stopAnimation();if(historyMode)setCamera(fit(layoutRef.current.nodes,.65,1));},[cancelEpoch,historyMode]);
  useEffect(()=>()=>{cancelAnimationFrame(raf.current);timers.current.forEach(clearTimeout);},[]);

  useEffect(()=>{
    if(!investigation||historyMode||lastEvent.current===investigation.id||!measured||measured.base!==base)return;
    lastEvent.current=investigation.id;stopAnimation();
    const changes=investigation.changes,obs=graph.observations.find((o:any)=>o.id===investigation.observationId);
    let point:any=null,landingId:string|null=null;
    if(obs?.representedAs==='relation'){
      // A report's carrier is the correspondence itself, not a proof road
      // which happens to cite that same report as one of its prerequisites.
      const edge=graph.edges.find((e:any)=>obs.edgeIds?.includes(e.id)&&e.sourceIds?.includes(obs.id)&&['attribution','corroboration','same-object'].includes(e.kind));
      const route=layout.routes.find((r:any)=>r.edgeIds.includes(edge?.id));if(route){point=route.midpoint;landingId=route.id;}
    }
    if(!point){const node=layout.nodes.find((n:any)=>n.id===(obs?.nodeId||obs?.id));if(node){point=node;landingId=node.id;}}
    if(!point)return;
    const run=token.current;
    if(investigation.result.kind==='repeat'||reducedMotion){setFresh({...changes,landingId});later(()=>setFresh(null),900,run);return;}
    setFresh({...changes,landingId});setPhase('fly');
    const oldCamera={...cam.current},vr=viewport.current!.getBoundingClientRect();
    const sx=point.x*oldCamera.s+oldCamera.x,sy=point.y*oldCamera.s+oldCamera.y;
    const inView=sx>45&&sx<vr.width-45&&sy>45&&sy<vr.height-45;
    const focused=centered(point,clamp(Math.max(oldCamera.s*1.2,1.18),1.18,1.42));
    const target={x:vr.left+(inView?sx:vr.width*.5),y:vr.top+(inView?sy:vr.height*.45)};
    const origin=investigation.origin;
    setFlight({d:`M ${origin.x} ${origin.y} Q ${(origin.x+target.x)/2} ${Math.min(origin.y,target.y)-90} ${target.x} ${target.y}`,x:target.x,y:target.y,key:investigation.id});
    if(!inView)moveCamera(focused,560,run);
    later(()=>{setFlight(null);setPhase('focus');moveCamera(focused,420,run);},560,run);
    const seedIds=new Set<string>([obs?.nodeId||obs?.id,...changes.addedNodeIds,...changes.activatedNodeIds]);
    const adjacent=new Set<string>(seedIds);
    for(const edge of graph.edges)if(seedIds.has(edge.from)||seedIds.has(edge.to)||changes.changedEdgeIds.includes(edge.id)){adjacent.add(edge.from);adjacent.add(edge.to);}
    const neighborhood=layout.nodes.filter((n:any)=>adjacent.has(n.id)).sort((a:any,b:any)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,6);
    const contextual=fit([point,...neighborhood],.68,Math.min(1.04,oldCamera.s||1));
    const enough=[point,...neighborhood].every((n:any)=>{const b=visibleBounds(n);return b.left*oldCamera.s+oldCamera.x>45&&b.right*oldCamera.s+oldCamera.x<vr.width-45&&b.top*oldCamera.s+oldCamera.y>45&&b.bottom*oldCamera.s+oldCamera.y<vr.height-45;});
    later(()=>{setPhase('connect');moveCamera(enough?oldCamera:contextual,800,run);},1260,run);
    later(()=>{setPhase('idle');setFresh(null);},2200,run);
  },[investigation,graph,layout,base,measured,reducedMotion,historyMode]);

  useEffect(()=>{
    const el=viewport.current!;
    const wheel=(e:WheelEvent)=>{e.preventDefault();stopAnimation();const r=el.getBoundingClientRect(),at={x:e.clientX-r.left,y:e.clientY-r.top};
      if(e.ctrlKey||e.metaKey){const s=clamp(cam.current.s*Math.exp(-e.deltaY*.0025),.45,1.8);setCamera({x:at.x-(at.x-cam.current.x)*s/cam.current.s,y:at.y-(at.y-cam.current.y)*s/cam.current.s,s});}
      else setCamera({...cam.current,x:cam.current.x-e.deltaX,y:cam.current.y-e.deltaY});};
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);
  },[]);
  useEffect(()=>{window.hifiMapSnapshot=()=>({camera:cam.current,phase,flight:!!flight,layout:structuredClone(layoutRef.current),fresh});return()=>{delete window.hifiMapSnapshot;};},[phase,flight,fresh]);
  const zoom=(factor:number)=>{stopAnimation();const r=viewport.current!.getBoundingClientRect(),c=cam.current,s=clamp(c.s*factor,.45,1.8);setCamera({x:r.width/2-(r.width/2-c.x)*s/c.s,y:r.height/2-(r.height/2-c.y)*s/c.s,s});};
  const beginDrag=(e:React.PointerEvent)=>{if(e.button!==0||(e.target as Element).closest('button,.road-hit'))return;stopAnimation();drag.current={x:e.clientX,y:e.clientY,camera:{...cam.current},moved:false,pointerId:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);};
  const onDrag=(e:React.PointerEvent)=>{const d=drag.current;if(!d||d.pointerId!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>4){d.moved=true;setDragging(true);setCamera({...d.camera,x:d.camera.x+dx,y:d.camera.y+dy});}};
  const endDrag=(e:React.PointerEvent)=>{const d=drag.current;if(!d)return;if(!d.moved)onSelect(null);drag.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
  const active=focus.active&&focus.related;
  const nodeClass=(n:any)=>`${focus.nodeIds?.includes(n.id)?'is-related':''} ${active&&!focus.nodeIds?.includes(n.id)?'is-quiet':''} ${fresh?.landingId===n.id?'is-landing':''} ${fresh?.addedNodeIds?.includes(n.id)&&phase==='fly'?'new-pending':''}`;
  const edgeClass=(r:any)=>{const related=r.edgeIds.some((id:string)=>focus.edgeIds?.includes(id));const changed=r.edgeIds.some((id:string)=>fresh?.addedEdgeIds?.includes(id)||fresh?.changedEdgeIds?.includes(id));return `${related?'is-related':''} ${active&&!related?'is-quiet':''} ${changed?'changed-road':''} ${changed&&['fly','focus'].includes(phase)?'new-pending':''} ${changed&&phase==='connect'?'growing-road':''}`;};
  const selectNode=(n:any)=>onSelect({kind:n.kind==='claim'?'claim':'evidence',id:n.id});
  const selectRoute=(r:any)=>onSelect(r.groupId?{kind:'group',id:r.groupId}:{kind:'edge',id:r.edgeIds[0]});
  return <div className="map-component" data-phase={phase}>
    <header className="map-heading"><div><h2>已知与推理</h2><p>观察留下线索，关联逐渐清晰</p></div><button className="map-legend-toggle" aria-expanded={legend} onClick={()=>setLegend(v=>!v)}>图注</button></header>
    <div className="map-notice" aria-live="polite"><span>{props.notice||'每一份观察，都会在这里留下位置。'}</span>{props.onOpenLatest&&<button onClick={props.onOpenLatest}>查看材料 ↗</button>}</div>
    {legend&&<div className="map-legend"><span>● 已知信息</span><span>▭ 已有依据的判断</span><span>◇ 共同支持</span><span>→ 支持的方向</span><span>— 核对关系</span><span className="frontier-color">┄ 尚待查明</span></div>}
    <div className={`map-viewport ${dragging?'dragging':''}`} ref={viewport} onPointerDown={beginDrag} onPointerMove={onDrag} onPointerUp={endDrag} onPointerCancel={()=>{drag.current=null;setDragging(false);}}>
      {!layout.nodes.length&&<div className="map-empty"><div className="empty-impression"/><h3>从眼前这只碗开始</h3><p>转动、观察，或找一份记录。<br/>你的认识会从第一次调查向外延伸。</p></div>}
      <div className="map-world" ref={world} style={{width:layout.width,height:layout.height,transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.s})`}}>
        <svg className="map-roads" width={layout.width} height={layout.height} aria-hidden="true"><defs>
          <marker id="map-support-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#707b56" strokeWidth="1.4"/></marker>
          <marker id="map-relation-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#797e70" strokeWidth="1.4"/></marker>
        </defs>{layout.routes.map((r:any)=><g key={r.id}>
          <path d={r.d} className={`road-clearance ${edgeClass(r)}`}/>
          <path d={r.d} pathLength={1} data-route={r.id} data-edge-ids={r.edgeIds.join('|')} className={`map-road ${r.kind==='support'?'support-road':''} ${edgeClass(r)}`} markerEnd={r.arrow?`url(#map-${r.kind==='support'?'support':'relation'}-arrow)`:undefined}/>
          <path d={r.d} className="road-hit" onClick={e=>{e.stopPropagation();selectRoute(r);}} onPointerEnter={()=>onHover(r.groupId?{kind:'group',id:r.groupId}:{kind:'edge',id:r.edgeIds[0]})} onPointerLeave={()=>onHover(null)}/>
        </g>)}{layout.frontiers.map((f:any)=><g key={f.id}>{f.paths.map((d:string,i:number)=><path key={i} d={d} className={`frontier-road ${focus.frontierIds?.includes(f.id)?'is-related':''}`} data-frontier-path={f.id}/>)}</g>)}</svg>
        {layout.routes.map((r:any)=><button key={r.id} className="road-key" aria-label={r.groupId?'回看共同支持':graph.edges.find((e:any)=>r.edgeIds.includes(e.id))?.label||'查看道路'} style={{left:r.midpoint.x-12,top:r.midpoint.y-12}} onClick={()=>selectRoute(r)}/>)}
        {layout.junctions.map((j:any)=><button className={`map-junction ${selection?.kind==='group'&&selection.id===j.groupId?'is-related':''}`} key={j.id} data-junction={j.groupId} style={{left:j.x-14,top:j.y-14}} aria-label="查看共同支持的依据" onClick={()=>onSelect({kind:'group',id:j.groupId})}><i/></button>)}
        {layout.nodes.map((n:any)=>n.box?<button key={n.id} data-map-node={n.id} className={`map-claim ${nodeClass(n)}`} style={{left:n.x-n.box.w/2,top:n.y-n.box.h/2,width:n.box.w,height:n.box.h}} onClick={()=>selectNode(n)} onPointerEnter={()=>onHover({kind:'claim',id:n.id})} onPointerLeave={()=>onHover(null)}>
          <span>{n.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</span><small>已有依据</small>
        </button>:<div key={n.id}>
          <button data-map-node={n.id} className={`map-dot ${nodeClass(n)}`} style={{left:n.x-12,top:n.y-12}} onClick={()=>selectNode(n)} aria-label={n.title}><i/></button>
          <button data-map-label={n.id} className={`map-label ${nodeClass(n)}`} style={{left:n.labelX,top:n.labelY,width:n.labelWidth}} onClick={()=>selectNode(n)} onPointerEnter={()=>onHover({kind:'evidence',id:n.id})} onPointerLeave={()=>onHover(null)}>
            {n.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}{n.subline&&<small>{n.subline}</small>}
          </button>
        </div>)}
        {layout.frontiers.map((f:any)=><button key={f.id} data-map-label={f.id} data-map-frontier={f.id} className={`map-question ${focus.frontierIds?.includes(f.id)?'is-related':''}`} style={{left:f.labelX,top:f.labelY,width:f.labelWidth}} onClick={()=>onSelect({kind:'gap',id:f.id})} onPointerEnter={()=>onHover({kind:'gap',id:f.id})} onPointerLeave={()=>onHover(null)}>{f.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</button>)}
      </div>
    </div>
    <footer className="map-footer"><span>{graph.observations.length} 份记录 · {graph.edges.length} 条关联</span><div className="map-tools"><button onClick={()=>zoom(1/1.15)} aria-label="缩小地图">−</button><span>{Math.round(camera.s*100)}%</span><button onClick={()=>zoom(1.15)} aria-label="放大地图">＋</button><button className="map-fit" onClick={()=>{stopAnimation();setCamera(fit(layout.nodes,.45,1));}}>全览</button></div></footer>
    {flight&&createPortal(<svg className="investigation-flight" aria-hidden="true" key={flight.key}><path d={flight.d} pathLength={1}/><circle r="3.6"><animateMotion dur="560ms" path={flight.d} fill="freeze"/></circle></svg>,document.body)}
  </div>;
}
