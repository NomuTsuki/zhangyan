import { useEffect, useMemo, useRef, useState } from 'react';
import BowlScene from './BowlScene';
import MapView from './MapView';
import MaterialViewer from './MaterialViewer';
import Dialog from './Dialog';
import { actionById, billText, buildGraph, cleanCopy, costNames, derive, diffGraphs, engine, observationTitle, placeById, places, resolveFocus, stageNames, type Investigation, type Selection } from './engine';

declare global {interface Window {hifiSnapshot?:()=>any;}}

export default function App(){
  const [session,setSession]=useState<any>(()=>engine.newSession(22));
  const [selection,setSelection]=useState<Selection>(null);
  const [hover,setHover]=useState<Selection>(null);
  const [openPlace,setOpenPlace]=useState<string|null>(null);
  const [visibleBody,setVisibleBody]=useState<string[]>(['OBJ_W','OBJ_D','SURF']);
  const [dialog,setDialog]=useState<'brief'|'history'|'stop'|'restart'|'settings'|null>(null);
  const [materialId,setMaterialId]=useState<string|null>(null);
  const [historyIndex,setHistoryIndex]=useState<number|null>(null);
  const [comparisonBasis,setComparisonBasis]=useState<string>('');
  const [notice,setNotice]=useState('');
  const [latestId,setLatestId]=useState<string|null>(null);
  const [investigation,setInvestigation]=useState<Investigation>(null);
  const [cancelEpoch,setCancelEpoch]=useState(0),[gameId,setGameId]=useState(0);
  const [reduceMotion,setReduceMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [note,setNote]=useState(''),[savedNote,setSavedNote]=useState('');
  const popRef=useRef<HTMLDivElement>(null),eventId=useRef(0);
  const viewSession=useMemo(()=>historyIndex===null?session:engine.replayLog(session.log.slice(0,historyIndex),session.budget,false),[session,historyIndex]);
  const model=useMemo(()=>derive(viewSession),[viewSession]);
  const focus=useMemo(()=>resolveFocus(hover||selection,model,viewSession),[hover,selection,model,viewSession]);
  const detailFocus=useMemo(()=>resolveFocus(selection,model,viewSession),[selection,model,viewSession]);
  const locked=historyIndex!==null||session.stopped;
  const activeRows=model.rows.filter((r:any)=>r.action.place===openPlace);
  const selectedAction=selection?.kind==='action'?model.rows.find((r:any)=>r.action.id===selection.id):null;
  const sourceIds=new Set(detailFocus.sourceIds||[]);
  const sourceRecords=model.graph.observations.filter((o:any)=>sourceIds.has(o.id));
  const selectedNode=selection?model.graph.nodes.find((n:any)=>n.id===selection.id):null;
  const subject=detailFocus.subject;
  const selectedClaim=selection?.kind==='claim'?model.overview.find((c:any)=>c.id===selection.id||c.claimId===selection.id):null;
  const selectedGap=selection?.kind==='gap'?model.graph.frontiers.find((f:any)=>f.id===selection.id):null;
  const selectedGroup=selection?.kind==='group'?model.graph.supportGroups.find((g:any)=>g.id===selection.id):null;

  const cancelMotion=()=>setCancelEpoch(n=>n+1);
  const clear=()=>{setSelection(null);setHover(null);setOpenPlace(null);};
  const choose=(next:Selection)=>{cancelMotion();setHover(null);setSelection(old=>old?.id===next?.id&&old?.kind===next?.kind?null:next);};
  function openDialog(kind:typeof dialog){cancelMotion();setOpenPlace(null);setDialog(kind);}
  function inspect(id:string){if(!model.graph.observations.some((o:any)=>o.id===id))return;cancelMotion();setOpenPlace(null);setMaterialId(id);}
  function choosePlace(id:string){
    cancelMotion();
    setOpenPlace(old=>old===id?null:id);setSelection({kind:'place',id});setHover(null);setComparisonBasis('');
  }
  function perform(row:any,button:HTMLElement){
    if(locked)return;
    const rect=button.getBoundingClientRect(),next=structuredClone(session);
    const before:any=buildGraph(engine.solve(session),session);
    const result=engine.take(next,row.action.id,comparisonBasis?{comparisonBasis}:{});
    if(!result.ok){setNotice(result.why||'先选择要比较的材料。');return;}
    const after:any=buildGraph(engine.solve(next),next),changes=diffGraphs(before,after);
    setSession(next);setOpenPlace(null);setSelection({kind:'evidence',id:result.observationId});setHover(null);setLatestId(result.observationId);
    setNotice(result.kind==='repeat'?'这份信息已经留存，本次复核仍消耗 1 次调查机会。':`已记录：${observationTitle(after,result.observationId)}`);
    setInvestigation({id:++eventId.current,observationId:result.observationId,result,changes,origin:{x:rect.left+rect.width*.5,y:rect.top+rect.height*.5}});
  }
  function restart(){setSession(engine.newSession(session.budget));setGameId(x=>x+1);setInvestigation(null);setHistoryIndex(null);setLatestId(null);setNotice('');setNote('');setSavedNote('');clear();setDialog(null);cancelMotion();}
  function stop(){const next=structuredClone(session);next.stopped=true;setSession(next);setSavedNote(note.trim());setDialog(null);setNotice('本局已收手。判断、依据和仍未说清的部分都保留下来。');clear();cancelMotion();}
  function reviewTurn(n:number){cancelMotion();setHistoryIndex(n);clear();setDialog(null);setLatestId(null);setNotice('');}
  function returnLive(){setHistoryIndex(null);clear();setNotice(session.stopped?'已回到收手时的记录。':'已回到当前调查。');cancelMotion();}

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!dialog&&!materialId){if(openPlace)setOpenPlace(null);else clear();}};
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[dialog,materialId,openPlace]);
  useEffect(()=>{
    if(!openPlace)return;
    const close=(e:PointerEvent)=>{if(popRef.current?.contains(e.target as Node)||(e.target as Element).closest('[data-place]'))return;setOpenPlace(null);};
    window.addEventListener('pointerdown',close);return()=>window.removeEventListener('pointerdown',close);
  },[openPlace]);
  useEffect(()=>{
    window.hifiSnapshot=()=>structuredClone({session,viewSession,historyIndex,gameId,selection,openPlace,visibleBody,
      graph:model.graph,claims:model.solved.claims,stage:model.solved.stage,stopping:model.solved.stopping,reduceMotion});
    return()=>{delete window.hifiSnapshot;};
  },[session,viewSession,historyIndex,gameId,selection,openPlace,visibleBody,model,reduceMotion]);

  const bodyPlaceVisible=!openPlace||placeById.get(openPlace)?.group!=='object'||visibleBody.includes(openPlace);
  const detailTitle=selectedGap?.title||selectedNode?.title||selectedClaim?.title||selectedAction?.action.name||
    (selectedGroup?'这些依据共同支持什么？':selection?.kind==='place'?placeById.get(selection.id)?.name:subject?.label||subject?.title||'');
  let detailCopy=selectedGap?.explanation||selectedNode?.summary||selectedAction?.action.ask||subject?.details||'';
  if(selectedGroup)detailCopy=`${model.graph.nodes.find((n:any)=>n.id===selectedGroup.targetId)?.title||'当前判断'}，需要下列依据共同成立。`;
  if(selectedClaim&&!selectedNode)detailCopy=selectedClaim.sourceIds.length?'已经留下一些相关信息，当前仍不足以作出这项判断。':'还没有能够支撑这项判断的调查记录。';
  const relevantRows=(detailFocus.actionIds||[]).map((id:string)=>model.rows.find((r:any)=>r.action.id===id)).filter(Boolean);

  return <main className="game-frame" data-history={historyIndex!==null} data-stopped={session.stopped}>
    <header className="game-topbar">
      <div className="brand" aria-label="掌眼">掌眼<span className="brand-seal">鉴</span></div>
      <div className="case-name">彩绘大碗<span>一号委托</span></div>
      <div className="session-heading">{historyIndex!==null?'回看调查':session.stopped?'本局已收手':'鉴定进行中'}</div>
      <div className="opportunities"><span>调查机会</span><strong>{Math.max(0,viewSession.budget-viewSession.log.length)}</strong><span className="budget-total">/ {viewSession.budget}</span></div>
      <button className="stop-button" onClick={()=>openDialog('stop')} disabled={locked}>收手，作出判断</button>
      <button className="top-link" onClick={()=>openDialog('brief')}>查看委托</button>
      <button className="top-link" onClick={()=>openDialog('history')}>调查记录<span className="record-count">{session.log.length}</span></button>
      <button className="settings-button" onClick={()=>openDialog('settings')} aria-label="设置">⚙</button>
    </header>
    {historyIndex!==null&&<div className="history-banner"><span>正在回看第 {historyIndex} 次调查后的记录，查看不消耗机会。</span><button onClick={returnLive}>回到当前调查 →</button></div>}
    <div className="workbench-columns">
      <aside className="object-panel">
        <header className="panel-heading object-heading"><h1>眼前之物</h1><span>转一转，再看一看</span></header>
        <BowlScene key={gameId} selectedTargetId={selection?.kind==='place'?selection.id:openPlace} onSelectTarget={choosePlace} onOrientationChange={setVisibleBody} disabled={false}/>
        <section className="outside-panel" aria-label="器物之外的调查">
          <div className="outside-heading"><h2>器物之外</h2><span>查档、送检与比对</span></div>
          <div className="outside-groups">{['送检','查档','比对','现状'].map(group=><section className={`investigation-group group-${group}`} key={group}>
            <h3>{group}</h3><div className="place-buttons">{places.filter(p=>p.group===group).map(p=>{
              const related=focus.placeIds?.includes(p.id)||model.rows.some((r:any)=>r.action.place===p.id&&focus.actionIds?.includes(r.action.id));
              const rows=model.rows.filter((r:any)=>r.action.place===p.id),done=rows.every((r:any)=>r.done);
              return <button key={p.id} data-place={p.id} className={`place-button ${openPlace===p.id?'selected':''} ${related?'related':''}`} onClick={()=>choosePlace(p.id)} aria-expanded={openPlace===p.id}>
                {p.name}{done&&<span className="done-dot" aria-label="已有记录"/>}
              </button>;
            })}</div>
          </section>)}</div>
          <div className="cost-ledger"><span>本局调查费用</span><span>{billText(viewSession)}</span></div>
        </section>
        {openPlace&&<div className="investigation-popover" ref={popRef} role="region" aria-label={`${placeById.get(openPlace)?.name}的调查手段`}>
          <div className="popover-heading"><span>{placeById.get(openPlace)?.name}</span><button aria-label="关闭手段" onClick={()=>setOpenPlace(null)}>×</button></div>
          {!bodyPlaceVisible&&<p className="condition-note">转动器物，让这个部位朝向你，便可以查看这里的手段。</p>}
          {bodyPlaceVisible&&activeRows.map((row:any)=><div className="method" key={row.action.id} data-action-row={row.action.id}>
            <button className="method-title" onClick={()=>choose({kind:'action',id:row.action.id})}>{row.action.name}</button>
            <p>{row.action.ask}</p>
            {row.comparisonOptions&&<fieldset className="comparison-options"><legend>用哪份材料比较？</legend>{row.comparisonOptions.map((o:any)=><label key={o.id} className={!o.usable?'unavailable':''}>
              <input type="radio" name="comparison-basis" value={o.id} checked={comparisonBasis===o.id} disabled={!o.usable||locked} onChange={()=>setComparisonBasis(o.id)}/><span>{o.label}{!o.usable&&<small>{o.why}</small>}</span>
            </label>)}</fieldset>}
            {!row.usable&&<div className="condition-note">{row.why}</div>}
            <div className="method-footer"><span>占 1 次 · {row.action.cost?`费用${costNames[row.action.cost]}`:'免费'}{row.done?' · 已做过':''}</span>
              <button className="investigate-button" data-action={row.action.id} disabled={locked||!row.usable||!row.affordable||!!row.comparisonOptions&&!comparisonBasis} onClick={e=>perform(row,e.currentTarget)}>{row.done?'再核查一次':'做这一步'}</button></div>
            {!row.affordable&&!locked&&<small>调查机会已用完，你仍可以查看记录并作出判断。</small>}
          </div>)}
          {locked&&<p className="condition-note">{historyIndex!==null?'正在回看历史，回到当前调查后再继续。':'本局已经收手，可以继续查看记录。'}</p>}
        </div>}
      </aside>

      <section className="knowledge-panel" aria-label="已知与推理">
        <MapView key={gameId} graph={model.graph} focus={focus} selection={selection} onSelect={choose} onHover={setHover}
          investigation={historyIndex===null?investigation:null} cancelEpoch={cancelEpoch} reducedMotion={reduceMotion} historyMode={historyIndex!==null}
          notice={notice} latestTitle={latestId?observationTitle(model.graph,latestId):''} onOpenLatest={latestId?()=>inspect(latestId):undefined}/>
      </section>

      <aside className="judgment-panel">
        <header className="panel-heading"><h2>我的判断</h2><span className="small-rule"/></header>
        <div className="commission-question"><span>这次委托</span><h3>它经历过什么，<br/>值得接手吗？</h3></div>
        <div className="judgment-overview">{model.overview.map((row:any)=><button key={row.id} data-claim={row.claimId} className={`judgment-row ${row.established?'established':''} ${selection?.id===row.id?'selected':''}`} onClick={()=>choose({kind:'claim',id:row.id})}>
          <span className="claim-state" aria-hidden="true">{row.established?'✓':'○'}</span><span>{row.title}</span><small>{row.statusLabel}</small>
        </button>)}</div>
        <div className="selection-details">
          {selection&&subject?<>
            <div className="detail-kicker"><span>{selection.kind==='gap'?'尚未接通':selection.kind==='action'?'调查手段':selection.kind==='edge'?'关系与依据':selection.kind==='claim'?'判断依据':'正在查看'}</span><button className="quiet-link" onClick={clear}>取消选择</button></div>
            <h3>{detailTitle}</h3>{detailCopy&&<p>{cleanCopy(detailCopy)}</p>}
            {selectedNode?.relations&&<ul className="relation-status">{selectedNode.relations.map((r:any)=><li key={r.key}><span>{r.status==='established'?'✓':'○'}</span>{r.title}<small>{r.status==='established'?'已核对':'待核对'}</small></li>)}</ul>}
            {selection.kind==='evidence'&&model.graph.observations.some((o:any)=>o.id===selection.id)&&<button className="material-link" onClick={()=>inspect(selection.id)}>展开这份材料 <span>↗</span></button>}
            {sourceRecords.length>0&&<div className="sources-section"><h4>回看依据</h4>{sourceRecords.map((o:any)=><button className="source-row" key={o.id} onClick={()=>inspect(o.id)}><span className="source-dot"/>{o.title}<span>↗</span></button>)}</div>}
            {(selectedClaim?.claimId==='coherentDecisionProfile')&&<div className="judgment-facets">{model.facets.map((f:any)=><div key={f.id}><span>{f.label}</span><strong>{f.stateLabel}</strong></div>)}</div>}
            {selectedAction&&<div className="selected-method"><div>占 1 次调查机会 · {costNames[selectedAction.action.cost]}费用</div>{!selectedAction.usable&&<p>{selectedAction.why}</p>}<button className="material-link" onClick={()=>choosePlace(selectedAction.action.place)}>在器物一侧查看手段 →</button></div>}
            {selectedGap&&relevantRows.length>0&&<details className="related-methods"><summary>有哪些方法可以了解它</summary>{relevantRows.map((row:any)=><button key={row.action.id} onClick={()=>{setSelection({kind:'action',id:row.action.id});setOpenPlace(row.action.place);}}><span>{row.action.name}</span><small>{costNames[row.action.cost]} · {row.usable?'可调查':'条件未齐'}</small></button>)}</details>}
          </>:<>
            <div className="detail-kicker">{session.stopped?'收手时留下的判断':'尚未说清'}</div>
            {session.stopped&&<p className="final-note">{savedNote||'我选择带着目前的判断与未解之处收手。'}</p>}
            {model.graph.frontiers.length?model.graph.frontiers.slice(0,5).map((f:any)=><button className="open-question" key={f.id} onClick={()=>choose({kind:'gap',id:f.id})}><span>○</span><div>{f.title}</div></button>):<p className="opening-copy">先把这只碗拿在眼前。<br/>观察留下的线索，会在这里<br/>逐渐形成你的判断。</p>}
            {model.graph.frontiers.length>5&&<span className="minor-copy">另有 {model.graph.frontiers.length-5} 处未决内容留在地图中。</span>}
          </>}
        </div>
        <footer className="judgment-footer"><span>{stageNames[model.solved.stage]||'鉴定进行中'}</span><small>仍可保留未解之处</small></footer>
      </aside>
    </div>

    {dialog==='brief'&&<Dialog title="这次委托" onClose={()=>setDialog(null)}><div className="brief-letter"><span className="letter-index">委托 · 01</span><h3>一只留下多次修补的彩绘大碗</h3><p>眼前是一只绘有商馆与帆船的大碗。器形、纹饰和修补留下的痕迹，未必讲述着同一段时间。</p><p>请判断它大致是什么，经历过哪些处理，以及目前的材料、表面、结构和记录，能支撑怎样的说明。</p><p>你可以把玩器物，也可以查档、比对或送检。每次具体调查占一次机会，专业调查另记费用档位。查看材料和旋转器物不消耗机会。</p><div className="letter-rule"/><p>什么时候已经足够，什么时候仍值得再查一步，由你决定。</p></div><button className="dark-button" onClick={()=>setDialog(null)}>回到器物</button></Dialog>}
    {dialog==='history'&&<Dialog title="调查记录" onClose={()=>setDialog(null)}><div className="history-list"><button onClick={()=>reviewTurn(0)}><span>开局</span><strong>还没有留下调查记录</strong><small>回看 →</small></button>{session.log.map((step:any,i:number)=><button key={i} onClick={()=>reviewTurn(i+1)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{actionById.get(step.actionId)?.name}</strong><small>{step.comparisonBasis?(step.comparisonBasis==='photo'?'比较旧照片 · ':'比较事故记录 · '):''}{costNames[step.cost]}费用</small></div><small>回看 →</small></button>)}</div><div className="history-bottom">{billText(session)}{historyIndex!==null&&<button className="quiet-link" onClick={()=>{returnLive();setDialog(null);}}>回到当前调查</button>}</div></Dialog>}
    {dialog==='stop'&&<Dialog title="收手，作出判断" onClose={()=>setDialog(null)}><p className="dialog-intro">你已经调查了 {session.log.length} 次。目前的依据与未决之处都会保留。</p><div className="stop-overview">{model.overview.map((c:any)=><div key={c.id}><span>{c.title}</span><strong>{c.statusLabel}</strong></div>)}</div><label className="note-label" htmlFor="judgment-note">留下你的判断</label><textarea id="judgment-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="哪些已经有把握，哪些仍需要保留？" rows={4}/><div className="dialog-actions"><button className="quiet-link" onClick={()=>setDialog(null)}>继续调查</button><button className="dark-button" onClick={stop}>确认收手</button></div></Dialog>}
    {dialog==='restart'&&<Dialog title="重新开始这次委托" onClose={()=>setDialog(null)}><p className="dialog-intro">这会清除本局的调查记录与判断，使用当前的 {session.budget} 次机会设置重新开始。</p><div className="dialog-actions"><button className="quiet-link" onClick={()=>setDialog(null)}>保留本局</button><button className="dark-button" onClick={restart}>重新开始</button></div></Dialog>}
    {dialog==='settings'&&<Dialog title="工作台设置" onClose={()=>setDialog(null)}><label className="setting-row"><span>减少动态效果<small>直接呈现调查后的关系，保留短暂强调。</small></span><input type="checkbox" checked={reduceMotion} onChange={e=>{setReduceMotion(e.target.checked);cancelMotion();}}/></label><label className="setting-row"><span>本局调查机会<small>{session.log.length?'已开始的调查不修改机会设置。':'开始第一次调查前可以设置。'}</small></span><input aria-label="本局调查机会" type="number" min={12} max={22} value={session.budget} disabled={!!session.log.length||session.stopped} onChange={e=>{const next=structuredClone(session);engine.setBudget(next,e.target.value);setSession(next);}}/></label><div className="setting-row"><span>重新开始<small>清除本局记录，重新鉴定这只碗。</small></span><button className="outlined-button" onClick={()=>setDialog('restart')}>重开</button></div></Dialog>}
    {materialId&&<MaterialViewer observationId={materialId} graph={model.graph} onClose={()=>setMaterialId(null)}/>}
  </main>;
}
