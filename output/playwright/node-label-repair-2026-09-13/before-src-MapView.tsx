import { useLanguage } from './locale';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { layoutMap, placeMapLabels } from './map-layout.mjs';
import type { Investigation, Selection } from './engine';
import { MOTION, roadTransitionPlan } from './map-motion.mjs';

type Camera={x:number;y:number;s:number};
type Phase='idle'|'fly'|'focus'|'pullback'|'connect';
type Props={graph:any;focus:any;selection:Selection;onSelect:(selection:Selection)=>void;onHover:(selection:Selection)=>void;
  investigation:Investigation;cancelEpoch:number;reducedMotion:boolean;historyMode:boolean;notice:string;latestTitle:string;onOpenLatest?:()=>void;onManualNavigation?:()=>void};
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

function maskBounds(samples:any[],width:number,height:number){
  if(!samples?.length)return {x:0,y:0,width,height};
  const xs=samples.map(p=>p.x),ys=samples.map(p=>p.y),x=Math.min(...xs)-24,y=Math.min(...ys)-24;
  return {x,y,width:Math.max(...xs)-x+24,height:Math.max(...ys)-y+24};
}
function SegmentMask({id,d,parts,width,height,bounds}:any){return <mask id={id} maskUnits="userSpaceOnUse" {...(bounds||{x:0,y:0,width,height})}>
  {parts.map((part:any,i:number)=><path key={i} d={d} fill="none" stroke="white" strokeWidth={18} pathLength={1} strokeDasharray={`${part.to-part.from} 2`} strokeDashoffset={-part.from}/>)}
</mask>;}

function routeHitPath(route:any){
  const points=route.samples||[];if(points.length<2)return route.d;
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  const total=lengths.at(-1)!;
  const at=(fraction:number)=>{const length=fraction*total,index=lengths.findIndex(n=>n>=length);if(index<=0)return points[0];const p=points[index-1],q=points[index],t=(length-lengths[index-1])/(lengths[index]-lengths[index-1]||1);return{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t};};
  return (route.visibleSegments||[{from:0,to:1}]).map((part:any)=>{const a=at(part.from),b=at(part.to),middle=points.filter((_:any,i:number)=>lengths[i]>part.from*total&&lengths[i]<part.to*total);return `M ${a.x} ${a.y} ${[...middle,b].map(p=>`L ${p.x} ${p.y}`).join(' ')}`;}).join(' ');
}

function RoadInk({r,index,timing,phase,layout,className,initialPending}:any){
  const prefix=`map-ink-${index}`,parts=r.visibleSegments||[{from:0,to:1}];
  const bounds=useMemo(()=>maskBounds(r.samples,layout.width,layout.height),[r.samples,layout.width,layout.height]);
  const ink=(key:string)=><g key={key}>
    <path d={r.d} className="road-clearance"/>
    <path d={r.d} pathLength={className.includes('handover-road')?undefined:1} data-route={r.id} data-edge-ids={r.edgeIds.join('|')} data-ink-layer={key}
      className={`map-road ${r.kind==='support'?'support-road':'correspondence-road'} ${r.kind==='enquiry'?'enquiry-road':''} ${className}`}
      markerEnd={r.arrow?'url(#map-support-arrow)':undefined}/>
  </g>;
  const pieces=timing?timing.growthSegments.flatMap((part:any)=>timing.both&&part.from===0&&part.to===1?
    [{from:0,to:.5,reverse:false},{from:.5,to:1,reverse:true}]:[{...part,reverse:timing.reverse||r.kind!=='support'&&!timing.enhanced&&part.from>.5}]):[];
  if(!timing&&parts.length===1&&parts[0].from===0&&parts[0].to===1)return <g data-road-group={r.id} className={initialPending?'new-pending':''}>{ink('settled')}</g>;
  return <g data-road-group={r.id} className={initialPending?'new-pending':''}>
    <defs>
      <SegmentMask id={`${prefix}-visible`} d={r.d} parts={parts} bounds={bounds}/>
      {timing&&<>
        <SegmentMask id={`${prefix}-prior`} d={r.d} parts={timing.priorSegments} bounds={bounds}/>
        <SegmentMask id={`${prefix}-growth`} d={r.d} parts={timing.growthSegments} bounds={bounds}/>
        {pieces.map((part:any,i:number)=><SegmentMask key={i} id={`${prefix}-piece-${i}`} d={r.d} parts={[part]} bounds={bounds}/>)}
        <mask id={`${prefix}-progress`} maskUnits="userSpaceOnUse" {...bounds}>
          {pieces.map((part:any,i:number)=>{const span=part.to-part.from,from=part.reverse?-part.to:span-part.from,to=-part.from;return <path key={i} data-growth-mask={r.id} data-growth-from={part.from} data-growth-to={part.to} d={r.d} mask={`url(#${prefix}-piece-${i})`} fill="none" stroke="white" strokeWidth={18} pathLength={1} strokeDasharray={`${span} 2`} strokeDashoffset={from}
            style={{'--reveal-from':from,'--reveal-to':to,animation:phase==='connect'?`road-segment-reveal ${timing.duration}ms linear ${timing.start}ms both`:undefined} as React.CSSProperties}/>;})}
        </mask>
      </>}
    </defs>
    {timing?<>
      <g mask={`url(#${prefix}-prior)`}>{ink('prior')}</g>
      <g mask={`url(#${prefix}-growth)`}><g mask={`url(#${prefix}-progress)`}>{ink('growing')}</g></g>
    </>:<g mask={`url(#${prefix}-visible)`}>{ink('settled')}</g>}
  </g>;
}

function FrontierInk({f,index,width,height,related,retiring=false,onSelect,timing,phase,pending=false,retireAt=0}:any){
  const segments=f.segments||f.paths.map((d:string)=>({d,from:0,to:1}));
  const retiredStyle=retiring&&phase==='connect'?{animation:`map-retire 160ms linear ${retireAt}ms both`}:undefined;
  return <g data-frontier-group={f.id} data-retiring={retiring} className={pending?'new-pending':''} style={retiredStyle}>{segments.map((s:any,i:number)=>{
    const id=`map-frontier-${retiring?'old':'live'}-${index}-${i}`;
    const scheduled=timing?.segments[i],parts=scheduled?.prior||[{from:s.from,to:s.to}];
    const ink=(key:string,mask:string)=><path key={key} d={s.d} mask={`url(#${mask})`} className={`frontier-road ${related?'is-related':''}`} data-frontier-path={f.id} data-canonical-route={s.canonicalRouteId||''} data-segment-from={s.from} data-segment-to={s.to}/>;
    return <g key={i}><defs><SegmentMask id={id} d={s.d} parts={parts} width={width} height={height}/>
      {scheduled?.growth.map((part:any,j:number)=>{const span=part.to-part.from,reverse=part.from>=.5,from=reverse?-part.to:span-part.from,to=-part.from;return <g key={j}><SegmentMask id={`${id}-piece-${j}`} d={s.d} parts={[part]} width={width} height={height}/><mask id={`${id}-grow-${j}`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
        <path data-frontier-growth={f.id} d={s.d} mask={`url(#${id}-piece-${j})`} fill="none" stroke="white" strokeWidth={18} pathLength={1} strokeDasharray={`${span} 2`} strokeDashoffset={from}
          style={{'--reveal-from':from,'--reveal-to':to,animation:phase==='connect'?`road-segment-reveal ${timing.duration}ms linear ${timing.start}ms both`:undefined} as React.CSSProperties}/>
      </mask></g>;})}</defs>
      {ink('prior',id)}{scheduled?.growth.map((_:any,j:number)=>ink(`grow-${j}`,`${id}-grow-${j}`))}
      {!retiring&&!timing&&!pending&&<path d={f.paths[i]} className="road-hit" data-frontier-hit={f.id} onClick={e=>{e.stopPropagation();onSelect?.({kind:'gap',id:f.id});}}/>}</g>;
  })}</g>;
}

export default function MapView(props:Props){
  const { language, t, f } = useLanguage();
  const {graph,focus,selection,onSelect,onHover,investigation,cancelEpoch,reducedMotion,historyMode}=props;
  const callbacks=useRef(props);callbacks.current=props;
  const viewport=useRef<HTMLDivElement>(null),world=useRef<HTMLDivElement>(null),previous=useRef<any>(null),priorLayout=useRef<any>(null);
  const base=useMemo(()=>{priorLayout.current=historyMode?null:previous.current;return layoutMap(graph,historyMode?null:previous.current,language);},[graph,historyMode,language]);
  const [measured,setMeasured]=useState<{base:any;layout:any}|null>(null);
  const layout:any=measured&&measured.base===base?measured.layout:base;
  const layoutRef=useRef<any>(layout);layoutRef.current=layout;
  const [cameraScale,setCameraScale]=useState(1),cam=useRef<Camera>({x:0,y:0,s:1});
  const [phase,setPhase]=useState<Phase>('idle'),[fresh,setFresh]=useState<any>(null);
  const [transition,setTransition]=useState<any>(null);
  const [flight,setFlight]=useState<{d:string;x:number;y:number;key:number}|null>(null);
  const [legend,setLegend]=useState(false),[dragging,setDragging]=useState(false);
  const raf=useRef(0),timers=useRef<number[]>([]),token=useRef(0),lastEvent=useRef<number|null>(null),initial=useRef(false);
  const drag=useRef<{x:number;y:number;camera:Camera;moved:boolean;pointerId:number}|null>(null);
  const setCamera=(v:Camera,publish=true)=>{
    if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||!Number.isFinite(v.s)||v.s<=0)return;
    const next={...v,s:clamp(v.s,.2,1.8)},old=cam.current;
    if(Math.abs(next.x-old.x)>1e-7||Math.abs(next.y-old.y)>1e-7||Math.abs(next.s-old.s)>1e-7){
      cam.current=next;
      if(world.current)world.current.style.transform=`translate(${next.x}px,${next.y}px) scale(${next.s})`;
    }
    if(publish)setCameraScale(next.s);
  };
  const stopAnimation=()=>{token.current++;cancelAnimationFrame(raf.current);timers.current.forEach(clearTimeout);timers.current=[];setFlight(null);setPhase('idle');setFresh(null);setTransition(null);setCameraScale(cam.current.s);};
  const manualNavigation=()=>{initial.current=true;callbacks.current.onManualNavigation?.();stopAnimation();};
  const later=(fn:()=>void,delay:number,run:number)=>{timers.current.push(window.setTimeout(()=>{if(token.current===run)fn();},delay));};
  function moveCamera(next:Camera,duration:number,run:number){
    cancelAnimationFrame(raf.current);const from={...cam.current},start=performance.now();
    const frame=(now:number)=>{if(run!==token.current)return;const t=Math.min(1,(now-start)/duration),f=ease(t);setCamera({x:from.x+(next.x-from.x)*f,y:from.y+(next.y-from.y)*f,s:from.s+(next.s-from.s)*f},t===1);if(t<1)raf.current=requestAnimationFrame(frame);};
    raf.current=requestAnimationFrame(frame);
  }
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
    if(!initial.current&&layout.nodes.length){if(!investigation)setCamera(fit(layout.nodes, .8,1));initial.current=true;}
  },[layout]);
  useEffect(()=>{stopAnimation();if(historyMode)setCamera(fit(layoutRef.current.nodes,.65,1));},[cancelEpoch,historyMode]);
  useEffect(()=>()=>{cancelAnimationFrame(raf.current);timers.current.forEach(clearTimeout);},[]);

  useLayoutEffect(()=>{
    if(!investigation||historyMode||lastEvent.current===investigation.id||!measured||measured.base!==base)return;
    lastEvent.current=investigation.id;stopAnimation();
    const changes=investigation.changes,obs=graph.observations.find((o:any)=>o.id===investigation.observationId);
    let point:any=null,landingId:string|null=null;
    if(obs?.representedAs==='relation'){
      // A report's carrier is the correspondence itself, not a proof road
      // which happens to cite that same report as one of its prerequisites.
      const edge=graph.edges.find((e:any)=>obs.edgeIds?.includes(e.id)&&e.sourceIds?.includes(obs.id)&&['attribution','corroboration','same-object'].includes(e.kind));
      const route=layout.routes.find((r:any)=>r.edgeIds.includes(edge?.id));if(route){point=layout.reportMarkers?.find((m:any)=>m.reportId===obs.id)||route.midpoint;landingId=route.id;}
    }
    if(!point){const node=layout.nodes.find((n:any)=>n.id===(obs?.nodeId||obs?.id));if(node){point=node;landingId=node.id;}}
    if(!point)return;
    const run=token.current;
    if(investigation.result.newlyAcquired===false||reducedMotion){setFresh({...changes,landingId});setCamera(fit([point],1,1));later(()=>setFresh(null),900,run);return;}
    const beforeLayout=priorLayout.current||layoutMap(investigation.beforeGraph||{nodes:[],edges:[],frontiers:[],supportGroups:[]},null,language);
    const plan:any=roadTransitionPlan(graph,layout,beforeLayout,changes);
    setTransition({...plan,beforeLayout});
    setFresh({...changes,landingId});setPhase('fly');
    const oldCamera={...cam.current},vr=viewport.current!.getBoundingClientRect();
    const sx=point.x*oldCamera.s+oldCamera.x,sy=point.y*oldCamera.s+oldCamera.y;
    const inView=sx>45&&sx<vr.width-45&&sy>45&&sy<vr.height-45;
    const focused=fit([point],1.1,clamp(Math.max(oldCamera.s*1.2,1.18),1.18,1.42));
    const target={x:vr.left+(inView?sx:point.x*focused.s+focused.x),y:vr.top+(inView?sy:point.y*focused.s+focused.y)};
    const origin=investigation.origin;
    setFlight({d:`M ${origin.x} ${origin.y} Q ${(origin.x+target.x)/2} ${Math.min(origin.y,target.y)-90} ${target.x} ${target.y}`,x:target.x,y:target.y,key:investigation.id});
    if(!inView)moveCamera(focused,MOTION.flight,run);
    later(()=>{setFlight(null);setPhase('focus');moveCamera(focused,MOTION.focus,run);},MOTION.flight,run);
    const seedIds=new Set<string>([obs?.nodeId||obs?.id,...changes.addedNodeIds,...changes.activatedNodeIds]);
    const adjacent=new Set<string>(seedIds);
    for(const edge of graph.edges)if(seedIds.has(edge.from)||seedIds.has(edge.to)||changes.changedEdgeIds.includes(edge.id)){adjacent.add(edge.from);adjacent.add(edge.to);}
    // Every new/activated result stays in the pullback. Only the additional old
    // neighbors are capped; a distant historical use must not be cropped away.
    const primary=layout.nodes.filter((n:any)=>seedIds.has(n.id));
    const neighbors=layout.nodes.filter((n:any)=>adjacent.has(n.id)&&!seedIds.has(n.id)).sort((a:any,b:any)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,Math.max(0,6-primary.length));
    const previousQuestions=plan.retiring.map((r:any)=>r.frontier);
    const followingQuestions=layout.frontiers.filter((f:any)=>plan.frontiers[f.id]);
    const continuityAnchors=new Set([...previousQuestions,...followingQuestions].flatMap((f:any)=>f.anchorIds));
    const continuityNodes=[...layout.nodes,...beforeLayout.nodes].filter((n:any)=>continuityAnchors.has(n.id));
    const neighborhood=[...primary,...neighbors,...continuityNodes,...plan.reportTransfers.flatMap((r:any)=>[r.fromNode,r]),...previousQuestions,...followingQuestions,
      ...plan.handovers.flatMap((r:any)=>r.points)];
    const contextual=fit([point,...neighborhood],.2,1.04);
    const enough=oldCamera.s>=.65&&[point,...neighborhood].every((n:any)=>{const b=visibleBounds(n);return b.left*oldCamera.s+oldCamera.x>45&&b.right*oldCamera.s+oldCamera.x<vr.width-45&&b.top*oldCamera.s+oldCamera.y>45&&b.bottom*oldCamera.s+oldCamera.y<vr.height-45;});
    const pullbackAt=MOTION.flight+MOTION.focus+MOTION.hold,connectAt=pullbackAt+MOTION.pullback;
    later(()=>{setPhase('pullback');moveCamera(enough?oldCamera:contextual,MOTION.pullback,run);},pullbackAt,run);
    later(()=>setPhase('connect'),connectAt,run);
    later(()=>{setPhase('idle');setFresh(null);setTransition(null);},connectAt+Math.max(350,plan.duration),run);
  },[investigation,graph,layout,base,measured,reducedMotion,historyMode]);

  useEffect(()=>{
    const el=viewport.current!;
    const wheel=(e:WheelEvent)=>{e.preventDefault();manualNavigation();const r=el.getBoundingClientRect(),at={x:e.clientX-r.left,y:e.clientY-r.top};
      if(e.ctrlKey||e.metaKey){const s=clamp(cam.current.s*Math.exp(-e.deltaY*.0025),.2,1.8);setCamera({x:at.x-(at.x-cam.current.x)*s/cam.current.s,y:at.y-(at.y-cam.current.y)*s/cam.current.s,s});}
      else setCamera({...cam.current,x:cam.current.x-e.deltaX,y:cam.current.y-e.deltaY});};
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);
  },[]);
  useEffect(()=>{window.hifiMapSnapshot=()=>({camera:cam.current,phase,flight:!!flight,flightPath:flight?.d||null,layout:structuredClone(layoutRef.current),fresh,transition:transition?{routes:transition.routes,nodeDelays:transition.nodeDelays,frontiers:transition.frontiers,retiring:transition.retiring,handovers:transition.handovers,reportTransfers:transition.reportTransfers,duration:transition.duration}:null});return()=>{delete window.hifiMapSnapshot;};},[phase,flight,fresh,transition]);
  const zoom=(factor:number)=>{manualNavigation();const r=viewport.current!.getBoundingClientRect(),c=cam.current,s=clamp(c.s*factor,.2,1.8);setCamera({x:r.width/2-(r.width/2-c.x)*s/c.s,y:r.height/2-(r.height/2-c.y)*s/c.s,s});};
  const beginDrag=(e:React.PointerEvent)=>{if(e.button!==0||(e.target as Element).closest('button,.road-hit'))return;e.preventDefault();window.getSelection()?.removeAllRanges();manualNavigation();drag.current={x:e.clientX,y:e.clientY,camera:{...cam.current},moved:false,pointerId:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);};
  const onDrag=(e:React.PointerEvent)=>{const d=drag.current;if(!d||d.pointerId!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>4){d.moved=true;setDragging(true);setCamera({...d.camera,x:d.camera.x+dx,y:d.camera.y+dy});}};
  const endDrag=(e:React.PointerEvent)=>{const d=drag.current;if(!d)return;if(!d.moved)onSelect(null);drag.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
  const routeHits=useMemo(()=>new Map(layout.routes.map((r:any)=>[r.id,routeHitPath(r)])),[layout.routes]);
  const active=focus.active&&focus.related;
  const incoming=investigation&&!historyMode&&lastEvent.current!==investigation.id?investigation.changes:null;
  const frontierPending=(f:any)=>!!incoming&&!investigation?.beforeGraph?.frontiers.some((old:any)=>old.id===f.id&&old.title===f.title&&JSON.stringify(old.anchorIds)===JSON.stringify(f.anchorIds));
  const nodeClass=(n:any)=>`${focus.nodeIds?.includes(n.id)?'is-related':''} ${focus.inputNodeIds?.includes(n.id)?'is-input':''} ${active&&!focus.nodeIds?.includes(n.id)?'is-quiet':''} ${fresh?.landingId===n.id?'is-landing':''} ${incoming?.addedNodeIds?.includes(n.id)?'new-pending':''}`;
  const appearance=(id:string,junction=false):React.CSSProperties=>{
    if(!transition)return {};
    const delay=(junction?transition.junctionDelays:transition.nodeDelays)[id];
    if(delay!==undefined)return phase==='connect'?{animation:`map-appear 240ms linear ${delay}ms both`}:{opacity:0,visibility:'hidden',pointerEvents:'none'};
    if(fresh?.addedNodeIds?.includes(id)&&phase==='fly')return {opacity:0,visibility:'hidden',pointerEvents:'none'};
    return {};
  };
  const edgeClass=(r:any)=>{const related=r.edgeIds.some((id:string)=>focus.edgeIds?.includes(id));return `${related?'is-related':''} ${active&&!related?'is-quiet':''}`;};
  const selectNode=(n:any)=>onSelect({kind:n.kind==='claim'?'claim':'evidence',id:n.id});
  const selectRoute=(r:any)=>onSelect(r.groupId?{kind:'group',id:r.groupId}:{kind:'edge',id:r.edgeIds[0]});
  const questionStyle=(f:any):React.CSSProperties=>{
    const timing=transition?.frontiers[f.id];
    if(frontierPending(f))return {opacity:0,visibility:'hidden',pointerEvents:'none'};
    if(!timing)return {};
    return phase==='connect'?{animation:`map-appear 240ms linear ${timing.end}ms both`}:{opacity:0,visibility:'hidden',pointerEvents:'none'};
  };
  const reportMarkerStyle=(marker:any):React.CSSProperties=>{
    const move=transition?.reportTransfers.find((m:any)=>m.reportId===marker.reportId);
    if(move)return phase==='connect'?{animation:`map-appear 240ms linear ${move.end}ms both`}:{opacity:0,visibility:'hidden'};
    if(incoming&&!investigation?.beforeGraph?.observations.some((o:any)=>o.id===marker.reportId))return {opacity:0,visibility:'hidden'};
    if(phase==='fly'&&investigation?.observationId===marker.reportId)return {opacity:0,visibility:'hidden'};
    return {};
  };
  return <div className="map-component" data-phase={phase}>
    <header className="map-heading"><div><h2>{t("已知与推理")}</h2><p>{t("观察留下线索，关联逐渐清晰")}</p></div><button className="map-legend-toggle" aria-expanded={legend} onClick={()=>setLegend(v=>!v)}>{t("图注")}</button></header>
    <div className="map-notice" aria-live="polite"><span>{t(props.notice||'每一份观察，都会在这里留下位置。')}</span>{props.onOpenLatest&&<button onClick={props.onOpenLatest}>{t("查看材料 ↗")}</button>}</div>
    {legend&&<div className="map-legend"><span>{t("● 已知信息与解释")}</span><span>{t("▭ 已有依据的判断")}</span><span>{t("◇ 共同支持")}</span><span>{t("→ 支持解释与判断")}</span><span>{t("— 对应与调查联系")}</span><span className="frontier-color">{t("┄ 沿路留下的疑问")}</span></div>}
    <div className={`map-viewport ${dragging?'dragging':''}`} ref={viewport} onPointerDown={beginDrag} onPointerMove={onDrag} onPointerUp={endDrag} onPointerCancel={()=>{drag.current=null;setDragging(false);}}>
      {!layout.nodes.length&&<div className="map-empty"><div className="empty-impression"/><h3>{t("从眼前这只碗开始")}</h3><p>{t("转动、观察，或找一份记录。")}<br/>{t("你的认识会从第一次调查向外延伸。")}</p></div>}
      <div className="map-world" ref={world} style={{width:layout.width,height:layout.height,transform:`translate(${cam.current.x}px,${cam.current.y}px) scale(${cam.current.s})`}}>
        <svg className="map-roads" width={layout.width} height={layout.height} aria-hidden="true"><defs>
          <marker id="map-support-arrow" viewBox="0 0 9 9" refX="8" refY="4.5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L8 4.5 L1 8 Z" fill="#687e4e"/></marker>
        </defs>
        {transition?.retiring.map(({frontier:f,retireAt}:any,i:number)=><FrontierInk key={`retiring-${f.id}`} f={f} index={i} width={layout.width} height={layout.height} retiring phase={phase} retireAt={retireAt}/>)}
        {transition?.handovers.map((r:any,i:number)=><g key={r.id} data-frontier-handover={r.frontierId} style={phase==='connect'?{animation:`map-retire 160ms linear ${Math.max(r.end,transition.retiring.find((f:any)=>f.frontier.id===r.frontierId)?.labelRetireAt||0)}ms both`}:undefined}>
          <RoadInk r={{...r,edgeIds:[],kind:'enquiry',arrow:false}} index={layout.routes.length+transition.reportTransfers.length+i} timing={{...r,priorSegments:[],growthSegments:[{from:0,to:1}]}} phase={phase} layout={layout} className="handover-road"/>
        </g>)}
        {transition?.reportTransfers.map((move:any,i:number)=><g key={`source-transfer-${move.reportId}`} data-source-transfer={move.reportId}
          style={phase==='connect'?{animation:`map-retire 160ms linear ${move.end}ms both`}:undefined}>
          <RoadInk r={move.sourceRoute} index={layout.routes.length+i} timing={transition.routes[move.sourceRoute.id]} phase={phase} layout={layout} className=""/>
        </g>)}
        {layout.routes.map((r:any,i:number)=><g key={r.id}>
          <RoadInk r={r} index={i} timing={transition?.routes[r.id]} phase={phase} layout={layout} className={edgeClass(r)} initialPending={incoming&&r.edgeIds.some((id:string)=>[...incoming.addedEdgeIds,...incoming.changedEdgeIds].includes(id))}/>
          <path d={routeHits.get(r.id) as string} className="road-hit" data-road-hit={r.id} style={incoming||transition?.routes[r.id]?{pointerEvents:'none'}:undefined} onClick={e=>{e.stopPropagation();selectRoute(r);}} onPointerEnter={()=>onHover(r.groupId?{kind:'group',id:r.groupId}:{kind:'edge',id:r.edgeIds[0]})} onPointerLeave={()=>onHover(null)}/>
        </g>)}{layout.frontiers.map((f:any,i:number)=><FrontierInk key={f.id} f={f} index={i} width={layout.width} height={layout.height} related={focus.frontierIds?.includes(f.id)} onSelect={onSelect} timing={transition?.frontiers[f.id]} phase={phase} pending={frontierPending(f)}/>)}</svg>
        {layout.routes.map((r:any)=><button key={r.id} className="road-key" disabled={!!incoming||!!transition?.routes[r.id]} aria-label={t(r.groupId?'回看共同支持':graph.edges.find((e:any)=>r.edgeIds.includes(e.id))?.label||'查看道路')} style={{left:r.midpoint.x-12,top:r.midpoint.y-12}} onClick={()=>selectRoute(r)}/>)}
        {layout.junctions.map((j:any)=><button className={`map-junction ${selection?.kind==='group'&&selection.id===j.groupId?'is-related':''}`} key={j.id} data-junction={j.groupId} style={{left:j.x-14,top:j.y-14,...appearance(j.id,true)}} aria-label={t("查看共同支持的依据")} onClick={()=>onSelect({kind:'group',id:j.groupId})}><i/></button>)}
        {(layout.roadLabels||[]).map((r:any)=><button key={r.id} data-map-label={r.id} data-road-label={r.routeId} className="map-relation-label" style={{left:r.labelX,top:r.labelY,width:r.labelWidth,fontSize:r.fontSize,lineHeight:`${r.lineHeight}px`,...(transition?.routes[r.routeId]&&!transition.beforeLayout.roadLabels.some((old:any)=>old.id===r.id)?(phase==='connect'?{animation:`map-appear 240ms linear ${transition.routes[r.routeId].end}ms both`}:{opacity:0}):{})}} onClick={()=>onSelect({kind:'edge',id:r.routeId})}>{r.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</button>)}
        {layout.nodes.map((n:any)=>n.box?<button key={n.id} data-map-node={n.id} className={`map-claim ${nodeClass(n)}`} style={{left:n.x-n.box.w/2,top:n.y-n.box.h/2,width:n.box.w,height:n.box.h,fontSize:n.fontSize,lineHeight:`${n.lineHeight}px`,...appearance(n.id)}} onClick={()=>selectNode(n)} onPointerEnter={()=>onHover({kind:'claim',id:n.id})} onPointerLeave={()=>onHover(null)}>
          <span>{n.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</span><small>{t("已有依据")}</small>
        </button>:<div key={n.id}>
          <button data-map-node={n.id} className={`map-dot ${nodeClass(n)}`} style={{left:n.x-15,top:n.y-15,...appearance(n.id)}} onClick={()=>selectNode(n)} aria-label={t(n.title)}><i/></button>
          <button data-map-label={n.id} className={`map-label ${nodeClass(n)}`} style={{left:n.labelX,top:n.labelY,width:n.labelWidth,fontSize:n.fontSize,lineHeight:`${n.lineHeight}px`,...appearance(n.id)}} onClick={()=>selectNode(n)} onPointerEnter={()=>onHover({kind:'evidence',id:n.id})} onPointerLeave={()=>onHover(null)}>
            {n.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}{n.subline&&<small style={{fontSize:n.sublineFontSize}}>{t(n.subline)}</small>}
          </button>
        </div>)}
        {(layout.reportMarkers||[]).map((marker:any)=><button key={marker.reportId} data-report-marker={marker.reportId}
          className={`map-dot map-report-marker ${selection?.id===marker.reportId?'is-related':''}`}
          style={{left:marker.x-15,top:marker.y-15,...reportMarkerStyle(marker)}} disabled={!!incoming||!!transition}
          aria-label={t(marker.title)} title={t(marker.title)} onClick={()=>onSelect({kind:'evidence',id:marker.reportId})}
          onPointerEnter={()=>onHover({kind:'evidence',id:marker.reportId})} onPointerLeave={()=>onHover(null)}><i/></button>)}
        {transition?.reportTransfers.map((move:any)=>{
          const n=move.fromNode,depart=phase==='connect'?{animation:`map-retire 160ms linear ${move.start}ms both`}:{};
          return <div key={`report-transfer-${move.reportId}`} aria-hidden="true" className="report-transfer">
            <span className="map-dot retained-report" data-retained-report={move.reportId} style={{left:n.x-15,top:n.y-15,...depart}}><i/></span>
            <span className="map-label" style={{left:n.labelX,top:n.labelY,width:n.labelWidth,fontSize:n.fontSize,lineHeight:`${n.lineHeight}px`,...depart}}>{n.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</span>
            <span className="report-traveler" data-report-traveler={move.reportId} style={{offsetPath:`path("${move.travel.d}")`,offsetRotate:'0deg',
              ...(phase==='connect'?{animation:`report-travel ${move.duration}ms linear ${move.start}ms both, map-appear 240ms linear ${move.start}ms both`}:{opacity:0})} as React.CSSProperties}/>
          </div>;
        })}
        {transition?.retiring.map(({frontier:f,labelRetireAt}:any)=><span key={`old-label-${f.id}`} className="map-question retiring-question" data-retiring-question={f.id} aria-hidden="true" style={{left:f.labelX,top:f.labelY,width:f.labelWidth,fontSize:f.fontSize,lineHeight:`${f.lineHeight}px`,pointerEvents:'none',...(phase==='connect'?{animation:`map-retire 160ms linear ${labelRetireAt}ms both`}:{})}}>{f.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</span>)}
        {layout.frontiers.map((f:any)=><button key={f.id} data-map-label={f.id} data-map-frontier={f.id} className={`map-question ${focus.frontierIds?.includes(f.id)?'is-related':''}`} style={{left:f.labelX,top:f.labelY,width:f.labelWidth,fontSize:f.fontSize,lineHeight:`${f.lineHeight}px`,...questionStyle(f)}} onClick={()=>onSelect({kind:'gap',id:f.id})} onPointerEnter={()=>onHover({kind:'gap',id:f.id})} onPointerLeave={()=>onHover(null)}>{f.lines.map((line:string,i:number)=><span className="map-line" key={i}>{line}</span>)}</button>)}
      </div>
    </div>
    <footer className="map-footer"><span>{f("{records} 份记录 · {relations} 条关联",{records:graph.observations.length,relations:graph.edges.filter((e:any)=>!['reference','context'].includes(e.kind)).length})}</span><div className="map-tools"><button onClick={()=>zoom(1/1.15)} aria-label={t("缩小地图")}>−</button><span>{Math.round(cameraScale*100)}%</span><button onClick={()=>zoom(1.15)} aria-label={t("放大地图")}>＋</button><button className="map-fit" onClick={()=>{manualNavigation();setCamera(fit([...layout.nodes,...layout.frontiers],.2,1));}}>{t("全览")}</button></div></footer>
    {flight&&createPortal(<svg className="investigation-flight" aria-hidden="true" key={flight.key}><path d={flight.d} pathLength={1}/><circle r="3.6"><animateMotion dur={`${MOTION.flight}ms`} path={flight.d} fill="freeze"/></circle></svg>,document.body)}
  </div>;
}
