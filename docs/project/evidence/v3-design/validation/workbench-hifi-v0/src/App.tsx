import { useLanguage } from './locale';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BowlScene from './BowlScene';
import MapView from './MapView';
import MaterialViewer, { type MaterialContext } from './MaterialViewer';
import { completedInvestigation } from './action-state.mjs';
import EngineWorker from './engine.worker.ts?worker&inline';
import { BackgroundEngine } from './engine-client.mjs';
import Dialog from './Dialog';
import { actionById, billText, cleanCopy, costNames, observationTitle, placeById, places, resolveFocus, stageNames, type Investigation, type Selection } from './engine';

declare global {interface Window {hifiSnapshot?:()=>any;}}
const emptySession=(budget=22)=>({acquired:[],log:[],billed:[0,0,0,0],stopped:false,budget});
const emptyModel:any={solved:{stage:'NONE',claims:{},stopping:{}},graph:{nodes:[],edges:[],frontiers:[],observations:[],supportGroups:[]},rows:[],overview:[],facets:[]};

export default function App(){
  const { language, setLanguage, t, f } = useLanguage();
  const [session,setSession]=useState<any>(()=>emptySession());
  const [viewSession,setViewSession]=useState<any>(()=>emptySession());
  const [model,setModel]=useState<any>(emptyModel);
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[viewBusy,setViewBusy]=useState(false),[stopping,setStopping]=useState(false),[engineError,setEngineError]=useState('');
  const background=useRef<BackgroundEngine|null>(null),pending=useRef(false),stopPending=useRef(false),revision=useRef(0),viewRequest=useRef(0),interaction=useRef(0);
  const [selection,setSelection]=useState<Selection>(null);
  const [hover,setHover]=useState<Selection>(null);
  const [openPlace,setOpenPlace]=useState<string|null>(null);
  const [visibleBody,setVisibleBody]=useState<string[]>(['OBJ_W','OBJ_D','SURF']);
  const [dialog,setDialog]=useState<'brief'|'history'|'stop'|'restart'|'settings'|null>(null);
  const [materialId,setMaterialId]=useState<string|null>(null);
  const [materialContext,setMaterialContext]=useState<MaterialContext|null>(null);
  const [historyIndex,setHistoryIndex]=useState<number|null>(null);
  const [comparisonBasis,setComparisonBasis]=useState<string>('');
  const [notice,setNotice]=useState('');
  const [latestId,setLatestId]=useState<string|null>(null);
  const [investigation,setInvestigation]=useState<Investigation>(null);
  const [cancelEpoch,setCancelEpoch]=useState(0),[gameId,setGameId]=useState(0);
  const [reduceMotion,setReduceMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [note,setNote]=useState(''),[savedNote,setSavedNote]=useState('');
  const popRef=useRef<HTMLDivElement>(null),eventId=useRef(0);
  const entryRef=useRef<HTMLElement|null>(null),anchorRect=useRef<DOMRect|null>(null);
  const [popoverPosition,setPopoverPosition]=useState({left:20,top:100});
  const focus=useMemo(()=>resolveFocus(hover||selection,model,viewSession),[hover,selection,model,viewSession]);
  const detailFocus=useMemo(()=>resolveFocus(selection,model,viewSession),[selection,model,viewSession]);
  const locked=historyIndex!==null||session.stopped||!ready||viewBusy;
  const activeRows=model.rows.filter((r:any)=>r.action.place===openPlace);
  const selectedAction=selection?.kind==='action'?model.rows.find((r:any)=>r.action.id===selection.id):null;
  const sourceIds=new Set(detailFocus.sourceIds||[]);
  const sourceRecords=model.graph.observations.filter((o:any)=>sourceIds.has(o.id));
  const selectedNode=selection?model.graph.nodes.find((n:any)=>n.id===selection.id):null;
  const subject=detailFocus.subject;
  const selectedClaim=selection?.kind==='claim'?model.overview.find((c:any)=>c.id===selection.id||c.claimId===selection.id):null;
  const selectedGap=selection?.kind==='gap'?model.graph.frontiers.find((f:any)=>f.id===selection.id):null;
  const selectedGroup=selection?.kind==='group'?model.graph.supportGroups.find((g:any)=>g.id===selection.id):null;

  const cancelMotion=()=>{interaction.current++;setCancelEpoch(n=>n+1);};
  const clear=()=>{setSelection(null);setHover(null);setOpenPlace(null);};
  const choose=(next:Selection)=>{cancelMotion();setHover(null);setSelection(old=>old?.id===next?.id&&old?.kind===next?.kind?null:next);};
  function openDialog(kind:typeof dialog){cancelMotion();setOpenPlace(null);setDialog(kind);}
  function inspect(id:string,retainContext=true){if(!model.graph.observations.some((o:any)=>o.id===id))return;cancelMotion();setOpenPlace(null);setMaterialContext(retainContext&&selection?{kind:selection.kind,id:selection.id,title:detailTitle||'当前所选内容',status:selectedClaim?.status,sourceIds:[...sourceIds] as string[]}:null);setMaterialId(id);}
  function choosePlace(id:string,anchor?:HTMLElement){
    cancelMotion();
    const fallback=document.querySelector<HTMLElement>(`[data-place="${id}"], [data-bowl-target="${id}"]`);
    entryRef.current=anchor||fallback;anchorRect.current=entryRef.current?.getBoundingClientRect()||null;
    setOpenPlace(old=>old===id?null:id);setSelection({kind:'place',id});setHover(null);setComparisonBasis('');
  }
  function accept(response:any,showView=true){
    if(response.revision>=revision.current){revision.current=response.revision;setSession(response.session);}
    if(showView){setViewSession(response.viewSession);setModel(response.model);setHistoryIndex(response.historyIndex);}
  }
  const failed=(error:any)=>{if(error?.name!=='AbortError')setNotice(`这次核对未能完成：${error.message||String(error)}`);};
  async function prepareGame(budget:number){
    const client=background.current;if(!client)return;
    pending.current=false;stopPending.current=false;revision.current=0;viewRequest.current++;setBusy(false);setViewBusy(false);setStopping(false);setReady(false);setEngineError('');
    const empty=emptySession(budget);setSession(empty);setViewSession(empty);setModel(emptyModel);
    const generation=client.generation+1;
    try{const response:any=await client.reset(budget);if(generation!==client.generation)return;accept(response);setReady(true);}
    catch(error:any){if(error?.name!=='AbortError'&&generation===client.generation)setEngineError(error.message||'工作台未能准备好。');}
  }
  useEffect(()=>{
    const client=new BackgroundEngine(()=>new EngineWorker());background.current=client;
    void prepareGame(22);
    return()=>{client.dispose();if(background.current===client)background.current=null;};
  },[]);
  async function perform(row:any){
    const client=background.current;if(locked||pending.current||stopPending.current||!client)return;
    const rect=entryRef.current?.isConnected?entryRef.current.getBoundingClientRect():anchorRect.current;if(!rect)return;
    const generation=client.generation,viewVersion=viewRequest.current,interactionVersion=interaction.current;
    const origin={x:rect.left+rect.width*.5,y:rect.top+rect.height*.5};
    pending.current=true;setBusy(true);setOpenPlace(null);setInvestigation(null);setNotice('正在核对这份材料…你仍可以把玩器物和查看已有记录。');
    try{
      const response:any=await client.request('take',{actionId:row.action.id,options:comparisonBasis?{comparisonBasis}:{},expectedRevision:revision.current});
      if(generation!==client.generation)return;
      const sameView=viewVersion===viewRequest.current;accept(response,sameView);if(!sameView)return;
      const {result,changes,beforeGraph}=response;if(!result.ok){setNotice(result.why||'先选择要比较的材料。');return;}
      setLatestId(result.observationId);setNotice(`已记录：${observationTitle(response.model.graph,result.observationId)}`);
      if(interaction.current===interactionVersion){
        setSelection({kind:'evidence',id:result.observationId});setHover(null);
        setInvestigation({id:++eventId.current,observationId:result.observationId,result,changes,origin,beforeGraph,originPlaceId:row.action.place});
      }
    }catch(error){if(generation===client.generation)failed(error);}
    finally{if(generation===client.generation){pending.current=false;setBusy(false);}}
  }
  function restart(){const budget=session.budget;setGameId(x=>x+1);setInvestigation(null);setHistoryIndex(null);setLatestId(null);setNotice('');setNote('');setSavedNote('');setMaterialId(null);setMaterialContext(null);clear();setDialog(null);cancelMotion();void prepareGame(budget);}
  async function stop(){
    const client=background.current;if(!client||stopPending.current||viewBusy)return;
    const generation=client.generation,version=viewRequest.current;stopPending.current=true;setStopping(true);setDialog(null);cancelMotion();setInvestigation(null);
    try{const response:any=await client.request('stop');if(generation!==client.generation)return;const sameView=version===viewRequest.current;accept(response,sameView);setSavedNote(note.trim());if(sameView){setNotice('本局已收手。判断、依据和仍未说清的部分都保留下来。');clear();}}
    catch(error){if(generation===client.generation)failed(error);}finally{if(generation===client.generation){stopPending.current=false;setStopping(false);}}
  }
  async function changeView(index:number|null){
    const client=background.current;if(!client||!ready)return;
    const generation=client.generation,version=++viewRequest.current;cancelMotion();setInvestigation(null);clear();setDialog(null);setLatestId(null);setViewBusy(true);setNotice(index===null?'正在返回当前记录…':'正在打开这段调查记录…');
    try{const response:any=await client.request('view',{historyIndex:index});if(generation!==client.generation||version!==viewRequest.current)return;accept(response);setNotice(index===null&&response.session.stopped?'已回到收手时的记录。':'');}
    catch(error){if(generation===client.generation&&version===viewRequest.current)failed(error);}finally{if(generation===client.generation&&version===viewRequest.current)setViewBusy(false);}
  }
  const reviewTurn=(n:number)=>{void changeView(n);};
  const returnLive=()=>{void changeView(null);};
  async function changeBudget(budget:string){
    const client=background.current;if(!client||pending.current||stopPending.current||viewBusy)return;
    const generation=client.generation,version=viewRequest.current;pending.current=true;setBusy(true);
    try{const response:any=await client.request('budget',{budget,expectedRevision:revision.current});if(generation!==client.generation)return;accept(response,version===viewRequest.current);if(!response.result.ok)setNotice(response.result.why);}
    catch(error){if(generation===client.generation)failed(error);}finally{if(generation===client.generation){pending.current=false;setBusy(false);}}
  }

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){cancelMotion();if(!dialog&&!materialId){if(openPlace)setOpenPlace(null);else clear();}}};
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[dialog,materialId,openPlace]);
  useEffect(()=>{
    if(!openPlace)return;
    const close=(e:PointerEvent)=>{if(popRef.current?.contains(e.target as Node)||(e.target as Element).closest('[data-place],[data-bowl-target]'))return;setOpenPlace(null);};
    window.addEventListener('pointerdown',close);return()=>window.removeEventListener('pointerdown',close);
  },[openPlace]);
  useLayoutEffect(()=>{
    if(!openPlace||!popRef.current)return;
    const position=()=>{
      // A method opened from a map question can refer to a body part which is
      // still facing away. Resolve its real entry when rotating reveals it.
      if(!entryRef.current?.isConnected)entryRef.current=document.querySelector<HTMLElement>(`.bowl-hotspot[data-bowl-target="${openPlace}"], [data-place="${openPlace}"], [data-bowl-target="${openPlace}"]`);
      const rect=entryRef.current?.isConnected?entryRef.current.getBoundingClientRect():anchorRect.current;
      if(!rect||!popRef.current)return;
      anchorRect.current=rect;
      const pop=popRef.current.getBoundingClientRect(),gap=12;
      let left=rect.right+gap;
      if(left+pop.width>window.innerWidth-16)left=rect.left-pop.width-gap;
      left=Math.max(16,Math.min(left,window.innerWidth-pop.width-16));
      const top=Math.max(86,Math.min(rect.top-8,window.innerHeight-pop.height-16));
      setPopoverPosition(old=>old.left===left&&old.top===top?old:{left,top});
    };
    position();const observer=new ResizeObserver(position);observer.observe(popRef.current);window.addEventListener('resize',position);
    return()=>{observer.disconnect();window.removeEventListener('resize',position);};
  },[openPlace,visibleBody,comparisonBasis,session,historyIndex]);
  useEffect(()=>{
    window.hifiSnapshot=()=>structuredClone({session,viewSession,historyIndex,gameId,selection,openPlace,visibleBody,
      graph:model.graph,claims:model.solved.claims,stage:model.solved.stage,stopping:model.solved.stopping,reduceMotion,materialContext,language,
      engineReady:ready,computeBusy:busy||viewBusy||stopping,workerGeneration:background.current?.generation,revision:revision.current,
      entryAnchor:anchorRect.current?{x:anchorRect.current.x,y:anchorRect.current.y,width:anchorRect.current.width,height:anchorRect.current.height}:null});
    return()=>{delete window.hifiSnapshot;};
  },[session,viewSession,historyIndex,gameId,selection,openPlace,visibleBody,model,reduceMotion,materialContext,ready,busy,viewBusy,stopping,language]);

  const bodyPlaceVisible=!openPlace||placeById.get(openPlace)?.group!=='object'||visibleBody.includes(openPlace);
  const detailTitle=selectedGap?.title||selectedNode?.title||selectedClaim?.title||selectedAction?.action.name||
    (selectedGroup?'这些依据共同支持什么？':selection?.kind==='place'?placeById.get(selection.id)?.name:subject?.label||subject?.title||'');
  let detailCopy=selectedGap?.explanation||selectedNode?.summary||selectedAction?.action.ask||subject?.details||subject?.summary||'';
  if(selectedGroup)detailCopy=`${model.graph.nodes.find((n:any)=>n.id===selectedGroup.targetId)?.title||'当前判断'}，需要下列依据共同成立。`;
  if(selectedClaim&&!selectedNode)detailCopy=selectedClaim.sourceIds.length?'已经留下一些相关信息，当前仍不足以作出这项判断。':'还没有能够支撑这项判断的调查记录。';
  const relevantRows=(detailFocus.actionIds||[]).map((id:string)=>model.rows.find((r:any)=>r.action.id===id)).filter(Boolean);

  if(!ready)return <main className="game-frame"><section role="status" style={{padding:40}}><h1>掌眼</h1><p>{t(engineError||'正在准备工作台…')}</p>{engineError&&<button className="outlined-button" onClick={()=>void prepareGame(session.budget)}>{t("重新准备")}</button>}</section></main>;
  return <main className="game-frame" data-language={language} data-history={historyIndex!==null} data-stopped={session.stopped} data-reduced-motion={reduceMotion} data-compute-busy={busy||viewBusy||stopping}>
    <header className="game-topbar">
      <div className="brand" aria-label={t("掌眼")}>掌眼<span className="brand-seal">鉴</span></div>
      <div className="case-name">{t("彩绘大碗")}<span>{t("一号委托")}</span></div>
      <div className="session-heading">{t(stopping?'正在保存判断':busy?'正在核对材料':viewBusy?'正在读取记录':historyIndex!==null?'回看调查':session.stopped?'本局已收手':'鉴定进行中')}</div>
      <div className="opportunities"><span>{t("调查机会")}</span><strong>{Math.max(0,viewSession.budget-viewSession.log.length)}</strong><span className="budget-total">/ {viewSession.budget}</span></div>
      <button className="stop-button" onClick={()=>openDialog('stop')} disabled={locked||stopping}>{t("收手，作出判断")}</button>
      <button className="top-link" onClick={()=>openDialog('brief')}>{t("查看委托")}</button>
      <button className="top-link" onClick={()=>openDialog('history')}>{t("调查记录")}<span className="record-count">{session.log.length}</span></button>
      <button className="settings-button" onClick={()=>openDialog('settings')} aria-label={t("设置")}>⚙</button>
      <button type="button" className="language-switch" aria-label={language==='zh'?'Switch to English':'切换为中文'}
        onClick={()=>{cancelMotion();setLanguage(language==='zh'?'en':'zh');}}>
        <span lang="zh-CN" className={language==='zh'?'active':''}>中</span><span aria-hidden="true">/</span><span lang="en" className={language==='en'?'active':''}>EN</span>
      </button>
    </header>
    {historyIndex!==null&&<div className="history-banner"><span>{f("正在回看第 {step} 次调查后的记录，查看不消耗机会。",{step:historyIndex})}</span><button onClick={returnLive}>{t("回到当前调查 →")}</button></div>}
    <div className="workbench-columns">
      <aside className="object-panel">
        <header className="panel-heading object-heading"><h1>{t("眼前之物")}</h1><span>{t("转一转，再看一看")}</span></header>
        <BowlScene key={gameId} selectedTargetId={selection?.kind==='place'?selection.id:openPlace} relatedTargetIds={focus.placeIds||[]} onSelectTarget={choosePlace} onOrientationChange={setVisibleBody} disabled={false}/>
        <section className="outside-panel" aria-label={t("器物之外的调查")}>
          <div className="outside-heading"><h2>{t("器物之外")}</h2><span>{t("查档、送检与比对")}</span></div>
          <div className="outside-groups">{['送检','查档','比对','现状'].map(group=><section className={`investigation-group group-${group}`} key={group}>
            <h3>{t(group)}</h3><div className="place-buttons">{places.filter(p=>p.group===group).map(p=>{
              const related=focus.placeIds?.includes(p.id)||model.rows.some((r:any)=>r.action.place===p.id&&focus.actionIds?.includes(r.action.id));
              const rows=model.rows.filter((r:any)=>r.action.place===p.id),done=rows.every((r:any)=>r.done);
              return <button key={p.id} data-place={p.id} className={`place-button ${openPlace===p.id?'selected':''} ${related?'related':''}`} onClick={e=>choosePlace(p.id,e.currentTarget)} aria-expanded={openPlace===p.id}>
                {t(p.name)}{done&&<span className="done-dot" aria-label={t("已有记录")}/>}
              </button>;
            })}</div>
          </section>)}</div>
          <div className="cost-ledger"><span>{t("本局调查费用")}</span><span>{t(billText(viewSession))}</span></div>
        </section>
        {openPlace&&<div className="investigation-popover" style={popoverPosition} ref={popRef} role="region" aria-label={f("{place}的调查手段",{place:t(placeById.get(openPlace)?.name)})}>
          <div className="popover-heading"><span>{t(placeById.get(openPlace)?.name)}</span><button aria-label={t("关闭手段")} onClick={()=>setOpenPlace(null)}>×</button></div>
          {!bodyPlaceVisible&&<p className="condition-note">{t("转动器物，让这个部位朝向你，便可以查看这里的手段。")}</p>}
          {bodyPlaceVisible&&activeRows.map((row:any)=>{const completed=completedInvestigation(viewSession,row.action.id,comparisonBasis);return <div className="method" key={row.action.id} data-action-row={row.action.id}>
            <button className="method-title" onClick={()=>choose({kind:'action',id:row.action.id})}>{t(row.action.name)}</button>
            <p>{t(row.action.ask)}</p>
            {row.comparisonOptions&&<fieldset className="comparison-options"><legend>{t("用哪份材料比较？")}</legend>{row.comparisonOptions.map((o:any)=><label key={o.id} className={!o.usable?'unavailable':''}>
              <input type="radio" name="comparison-basis" value={o.id} checked={comparisonBasis===o.id} disabled={!o.usable||locked} onChange={()=>setComparisonBasis(o.id)}/><span>{t(o.label)}{completedInvestigation(viewSession,row.action.id,o.id)&&<small>{t("这组材料已比较，可查看记录")}</small>}{!o.usable&&<small>{t(o.why)}</small>}</span>
            </label>)}</fieldset>}
            {!row.usable&&<div className="condition-note">{t(row.why)}</div>}
            <div className="method-footer"><span>{t(completed?t("记录已留存"):row.action.cost?f("占 1 次 · 费用{cost}",{cost:t(costNames[row.action.cost])}):t("占 1 次 · 免费"))}</span>
              <button className="investigate-button" data-action={row.action.id} disabled={!!completed||locked||busy||stopping||!row.usable||!row.affordable||!!row.comparisonOptions&&!comparisonBasis} onClick={()=>void perform(row)}>{t(completed?'已经做过':busy||stopping?'核对中…':'做这一步')}</button></div>
            {completed&&<button className="completed-record quiet-link" onClick={()=>inspect(completed.observationId,false)}>{f("查看第 {step} 次调查记录 · 免费",{step:completed.step})}</button>}
            {!row.affordable&&!locked&&<small>{t("调查机会已用完，你仍可以查看记录并作出判断。")}</small>}
          </div>;})}
          {locked&&<p className="condition-note">{t(historyIndex!==null?'正在回看历史，回到当前调查后再继续。':'本局已经收手，可以继续查看记录。')}</p>}
        </div>}
      </aside>

      <section className="knowledge-panel" aria-label={t("已知与推理")}>
        <MapView key={gameId} graph={model.graph} focus={focus} selection={selection} onSelect={choose} onHover={setHover} onManualNavigation={cancelMotion}
          investigation={historyIndex===null?investigation:null} cancelEpoch={cancelEpoch} reducedMotion={reduceMotion} historyMode={historyIndex!==null}
          notice={notice} latestTitle={latestId?observationTitle(model.graph,latestId):''} onOpenLatest={latestId?()=>inspect(latestId,false):undefined}/>
      </section>

      <aside className="judgment-panel">
        <header className="panel-heading"><h2>{t("我的判断")}</h2><span className="small-rule"/></header>
        <div className="commission-question"><span>{t("这次委托")}</span><h3>{t("它经历过什么，")}<br/>{t("值得接手吗？")}</h3></div>
        <div className="judgment-overview">{model.overview.map((row:any)=><button key={row.id} data-claim={row.claimId} className={`judgment-row ${row.established?'established':''} ${selection?.id===row.id?'selected':''}`} onClick={()=>choose({kind:'claim',id:row.id})}>
          <span className="claim-state" aria-hidden="true">{row.established?'✓':'○'}</span><span>{t(row.title)}</span><small>{t(row.statusLabel)}</small>
        </button>)}</div>
        <div className="selection-details">
          {selection&&subject?<>
            <div className="detail-kicker"><span>{t(selection.kind==='gap'?'尚未接通':selection.kind==='action'?'调查手段':selection.kind==='edge'?'关系与依据':selection.kind==='claim'?'判断依据':'正在查看')}</span><button className="quiet-link" onClick={()=>{cancelMotion();clear();}}>{t("取消选择")}</button></div>
            <h3>{t(detailTitle)}</h3>{detailCopy&&<p>{t(cleanCopy(detailCopy))}</p>}
            {selectedNode?.relations&&<ul className="relation-status">{selectedNode.relations.map((r:any)=><li key={r.key}><span>{r.status==='established'?'✓':'○'}</span>{t(r.title)}<small>{t(r.status==='established'?'已核对':'待核对')}</small></li>)}</ul>}
            {selection.kind==='evidence'&&model.graph.observations.some((o:any)=>o.id===selection.id)&&<button className="material-link" onClick={()=>inspect(selection.id)}>{t("展开这份材料")}<span>↗</span></button>}
            {!!detailFocus.inputSources?.length&&<div className="sources-section input-sources"><h4>{t("本次核对用到的材料")}</h4>{detailFocus.inputSources.map((o:any)=><button className="source-row" key={o.id} onClick={()=>inspect(o.id)}><span className="source-dot"/>{t(o.title)}<span>↗</span></button>)}</div>}
            {sourceRecords.length>0&&<div className="sources-section"><h4>{t("回看依据")}</h4>{sourceRecords.map((o:any)=><button className="source-row" key={o.id} onClick={()=>inspect(o.id)}><span className="source-dot"/>{t(o.title)}<span>↗</span></button>)}</div>}
            {(selectedClaim?.claimId==='coherentDecisionProfile')&&<div className="judgment-facets">{model.facets.map((f:any)=><div key={f.id}><span>{t(f.label)}</span><strong>{t(f.stateLabel)}</strong></div>)}</div>}
            {selectedAction&&<div className="selected-method"><div>{f("占 1 次调查机会 · {cost}费用",{cost:t(costNames[selectedAction.action.cost])})}</div>{!selectedAction.usable&&<p>{t(selectedAction.why)}</p>}<button className="material-link" onClick={()=>choosePlace(selectedAction.action.place)}>{t("在器物一侧查看手段 →")}</button></div>}
            {selectedGap&&relevantRows.length>0&&<details className="related-methods"><summary>{t("有哪些方法可以了解它")}</summary>{relevantRows.map((row:any)=><button key={row.action.id} onClick={()=>{choosePlace(row.action.place);setSelection({kind:'action',id:row.action.id});}}><span>{t(row.action.name)}</span><small>{t(costNames[row.action.cost])} · {t(row.usable?'可调查':'条件未齐')}</small></button>)}</details>}
          </>:<>
            <div className="detail-kicker">{t(session.stopped?'收手时留下的判断':model.graph.frontiers.length?'尚未说清':model.graph.observations.length?'已有调查记录':'尚未说清')}</div>
            {session.stopped&&<p className="final-note">{savedNote||t('我选择带着目前的判断与未解之处收手。')}</p>}
            {model.graph.frontiers.length?model.graph.frontiers.slice(0,5).map((f:any)=><button className="open-question" key={f.id} onClick={()=>choose({kind:'gap',id:f.id})}><span>○</span><div>{t(f.title)}</div></button>):model.graph.observations.length?<p className="opening-copy">{t("已有材料和判断保留在地图中。")}<br/>{t("点击一项判断，可以回查它的依据。")}</p>:<p className="opening-copy">{t("先把这只碗拿在眼前。")}<br/>{t("观察留下的线索，会在这里")}<br/>{t("逐渐形成你的判断。")}</p>}
            {model.graph.frontiers.length>5&&<span className="minor-copy">{f("另有 {count} 处未决内容留在地图中。",{count:model.graph.frontiers.length-5})}</span>}
          </>}
        </div>
        <footer className="judgment-footer"><span>{t(stageNames[model.solved.stage]||'鉴定进行中')}</span><small>{t("仍可保留未解之处")}</small></footer>
      </aside>
    </div>

    {dialog==='brief'&&<Dialog title={t("这次委托")} onClose={()=>setDialog(null)}><div className="brief-letter"><span className="letter-index">{t("委托 · 01")}</span><h3>{t("一只留下多次修补的彩绘大碗")}</h3><p>{t("眼前是一只绘有商馆与帆船的大碗。器形、纹饰和修补留下的痕迹，未必讲述着同一段时间。")}</p><p>{t("请判断它大致是什么，经历过哪些处理，以及目前的材料、表面、结构和记录，能支撑怎样的说明。")}</p><p>{t("你可以把玩器物，也可以查档、比对或送检。每次具体调查占一次机会，专业调查另记费用档位。查看材料和旋转器物不消耗机会。")}</p><div className="letter-rule"/><p>{t("什么时候已经足够，什么时候仍值得再查一步，由你决定。")}</p></div><button className="dark-button" onClick={()=>setDialog(null)}>{t("回到器物")}</button></Dialog>}
    {dialog==='history'&&<Dialog title={t("调查记录")} onClose={()=>setDialog(null)}><div className="history-list"><button onClick={()=>reviewTurn(0)}><span>{t("开局")}</span><strong>{t("还没有留下调查记录")}</strong><small>{t("回看 →")}</small></button>{session.log.map((step:any,i:number)=><button key={i} onClick={()=>reviewTurn(i+1)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{t(actionById.get(step.actionId)?.name)}</strong><small>{t(step.comparisonBasis?(step.comparisonBasis==='photo'?'比较旧照片 · ':'比较事故记录 · '):'')}{f("{cost}费用",{cost:t(costNames[step.cost])})}</small></div><small>{t("回看 →")}</small></button>)}</div><div className="history-bottom">{t(billText(session))}{historyIndex!==null&&<button className="quiet-link" onClick={()=>{returnLive();setDialog(null);}}>{t("回到当前调查")}</button>}</div></Dialog>}
    {dialog==='stop'&&<Dialog title={t("收手，作出判断")} onClose={()=>setDialog(null)}><p className="dialog-intro">{f("你已经调查了 {count} 次。目前的依据与未决之处都会保留。",{count:session.log.length})}</p><div className="stop-overview">{model.overview.map((c:any)=><div key={c.id}><span>{t(c.title)}</span><strong>{t(c.statusLabel)}</strong></div>)}</div><label className="note-label" htmlFor="judgment-note">{t("留下你的判断")}</label><textarea id="judgment-note" value={note} onChange={e=>setNote(e.target.value)} placeholder={t("哪些已经有把握，哪些仍需要保留？")} rows={4}/><div className="dialog-actions"><button className="quiet-link" onClick={()=>setDialog(null)}>{t("继续调查")}</button><button className="dark-button" onClick={stop}>{t("确认收手")}</button></div></Dialog>}
    {dialog==='restart'&&<Dialog title={t("重新开始这次委托")} onClose={()=>setDialog(null)}><p className="dialog-intro">{f("这会清除本局的调查记录与判断，使用当前的 {budget} 次机会设置重新开始。",{budget:session.budget})}</p><div className="dialog-actions"><button className="quiet-link" onClick={()=>setDialog(null)}>{t("保留本局")}</button><button className="dark-button" onClick={restart}>{t("重新开始")}</button></div></Dialog>}
    {dialog==='settings'&&<Dialog title={t("工作台设置")} onClose={()=>setDialog(null)}><label className="setting-row"><span>{t("减少动态效果")}<small>{t("直接呈现调查后的关系，保留短暂强调。")}</small></span><input type="checkbox" checked={reduceMotion} onChange={e=>{setReduceMotion(e.target.checked);cancelMotion();}}/></label><label className="setting-row"><span>{t("本局调查机会")}<small>{t(session.log.length?'已开始的调查不修改机会设置。':'开始第一次调查前可以设置。')}</small></span><input aria-label={t("本局调查机会")} type="number" min={12} max={22} value={session.budget} disabled={!!session.log.length||session.stopped||busy||viewBusy} onChange={e=>void changeBudget(e.target.value)}/></label><div className="setting-row"><span>{t("重新开始")}<small>{t("清除本局记录，重新鉴定这只碗。")}</small></span><button className="outlined-button" onClick={()=>setDialog('restart')}>{t("重开")}</button></div></Dialog>}
    {materialId&&<MaterialViewer observationId={materialId} graph={model.graph} context={materialContext} onClose={()=>setMaterialId(null)}/>}
  </main>;
}
