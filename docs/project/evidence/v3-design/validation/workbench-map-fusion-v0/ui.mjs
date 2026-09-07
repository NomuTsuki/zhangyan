import { newSession, solve, take, workbench, setBudget } from "../workbench-map-v0/session.mjs";
import { ACTIONS, ACTION_BY_ID, COST_LABEL } from "../knowledge-map-slice-v0/case.mjs";
import { ACTION_SEMANTICS, STAGE_SEMANTICS } from "../evidence-semantics-v0/semantics.mjs";
import { buildGraph, diffGraphs } from "./graph.mjs";
import { layoutGraph } from "./layout.mjs";
import { resolveSelection, judgmentOverview, judgmentFacets } from "./selection.mjs";

export function mount() {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  const svgNS = "http://www.w3.org/2000/svg";
  const clone = value => structuredClone(value);
  const ON_OBJECT = {
  OBJ_D: { x: 96,  y: 92,  label: "纹饰与色差", anchor: "end" },
  OBJ_R: { x: 214, y: 84,  label: "没被改动的特征", anchor: "start" },
  OBJ_W: { x: 153, y: 138, label: "整只碗",     anchor: "middle" },
  SURF:  { x: 196, y: 132, label: "表面",       anchor: "start" },
  OBJ_F: { x: 153, y: 204, label: "底足与修足", anchor: "middle" },
};
const OUTSIDE = [
  { grp: "送去化验／拍片", places: [
    { id: "XRAY", label: "X 射线成像" },
    { id: "UV",   label: "紫外照一照" },
    { id: "MAT",  label: "材料化验" }]},
  { grp: "翻纸面记录", places: [
    { id: "T1",   label: "更早的影像" },
    { id: "T2",   label: "出过事的记录" },
    { id: "T3",   label: "后来动过的记录" },
    { id: "PROV", label: "经手记录" }]},
  { grp: "拿真品对比", places: [
    { id: "CORPUS", label: "同期的真品" },
    { id: "RPT",    label: "换一批真品" }]},
  { grp: "看现在的状况", places: [
    { id: "STAB", label: "结不结实、能不能展" }]},
];
const PLACE_LABEL = new Map([
  ...Object.entries(ON_OBJECT).map(([id, p]) => [id, p.label]),
  ...OUTSIDE.flatMap((g) => g.places.map((p) => [p.id, p.label])),
]);


  let session = newSession(), viewSession = session;
  let solved, graph, layout = null, selection = null, hovered = null;
  let historyIndex = null, frames = [], liveLayout = null, zoom = 1;
  let openPlace = null, popAnchor = null, showMethods = false, finalNote = "";
  let transient = null, animationTimer = null;
  let notice = "在左侧任选一处开始。缺口从本局已知内容中生长。";
  const stateText = { pending:"材料已取得 · 意义未定", contested:"存在争议", established:"已有依据", limited:"有范围限制", repeat:"重复记录" };
  const nodeById = id => graph.nodes.find(node => node.id === id);
  const observation = id => graph.observations.find(item => item.id === id || item.observationId === id);
  const actionRows = () => workbench(viewSession);
  const placeName = id => PLACE_LABEL.get(id) || "调查手段";
  const billText = s => COST_LABEL.map((name, index) => name + " × " + s.billed[index]).join(" · ");
  const selectionForNode = node => ({ kind:node.kind === "claim" ? "claim" : "evidence", id:node.id });
  const attrs = (kind, id) => ' data-kind="' + esc(kind) + '" data-id="' + esc(id) + '"';
  function sourceButtons(ids) {
    return [...new Set(ids || [])].map(id => {
      const o = observation(id), log = viewSession.log.find(step => step.observationId === id);
      const title = o?.title || (log && ACTION_BY_ID.get(log.actionId)?.name) || "原始记录";
      return '<button class="detail-button"' + attrs("evidence", id) + '>' + esc(title) + '</button>';
    }).join("");
  }
  function nodeButtons(ids) {
    return ids.map(id => nodeById(id)).filter(Boolean).map(node =>
      '<button class="detail-button"' + attrs(selectionForNode(node).kind, node.id) + '>' + esc(node.title) + '</button>').join("");
  }
  function questionButtons(list) {
    return list.map(q => '<button class="detail-button question-button"' + attrs("gap", q.id) + '>' + esc(q.title) + '</button>').join("");
  }
  function methodHTML(item) {
    const a = item.action, sem = ACTION_SEMANTICS[a.id] || {};
    const available = item.usable && item.affordable && historyIndex === null;
    const why = historyIndex !== null ? "正在回看历史，回到本局后再调查。" : session.stopped ? "本局已经收手。" :
      !item.affordable ? "本局调查机会已用完。" : item.why;
    return '<div class="method' + (selection?.kind === "action" && selection.id === a.id ? " focused" : "") + '" data-method="' + esc(a.id) + '">' +
      '<h3><button class="method-title"' + attrs("action", a.id) + '>' + esc(a.name) + '</button></h3>' +
      '<div class="cost">占 1 步 · ' + (a.cost === 0 ? "不花钱" : "费用 " + esc(COST_LABEL[a.cost])) + (item.done ? " · 本局做过" : "") + '</div>' +
      '<p>' + esc(a.ask) + '</p><details><summary>为什么要紧</summary><p>' + esc(sem.doesWhat || a.ask) + '</p><p>' + esc(sem.whyLong || sem.whyShort || "") + '</p></details>' +
      (why ? '<p class="reason">' + esc(why) + '</p>' : "") +
      '<button class="execute' + (available ? " primary" : "") + '" data-take="' + esc(a.id) + '"' + (available ? "" : " disabled") + '>' + (item.done ? "再做一次" : "做这一步") + '</button></div>';
  }
  function focusFor(sel = selection) { return resolveSelection(sel, graph, solved, viewSession, actionRows()); }
  function renderBench() {
    const rows = actionRows();
    let markup = '<path class="bowl" d="M73 74H232C229 155 206 208 153 213C100 208 77 154 73 74Z"/>';
    for (const [id, p] of Object.entries(ON_OBJECT)) {
      const items = rows.filter(item => item.action.place === id);
      const textX = p.anchor === "end" ? p.x - 9 : p.anchor === "start" ? p.x + 9 : p.x;
      const textY = p.anchor === "middle" ? p.y + 18 : p.y + 4;
      markup += '<g class="hot' + (items.every(item => item.done) ? " spent" : "") + '"' + attrs("place", id) +
        ' role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="' + (openPlace === id) + '" aria-label="' + esc(p.label + "，打开 " + items.length + " 个具体手段") + '">' +
        '<circle class="hit" cx="' + p.x + '" cy="' + p.y + '" r="23"/><circle class="dot" cx="' + p.x + '" cy="' + p.y + '" r="5"/>' +
        '<text x="' + textX + '" y="' + textY + '" text-anchor="' + p.anchor + '">' + esc(p.label) + '</text>' +
        '<text class="meta" x="' + textX + '" y="' + (textY + 13) + '" text-anchor="' + p.anchor + '">' + items.length + ' 个手段 ›</text></g>';
    }
    $("object").innerHTML = markup;
    $("outside").innerHTML = OUTSIDE.map(group => '<div class="group-label">' + esc(group.grp) + '</div>' +
      group.places.map(p => {
        const items = rows.filter(item => item.action.place === p.id);
        const cost = Math.min(...items.map(item => item.action.cost));
        return '<button class="place-row' + (items.every(item => item.done) ? " spent" : "") + '"' + attrs("place", p.id) + ' aria-haspopup="dialog" aria-expanded="' + (openPlace === p.id) + '">' +
          '<span class="name">' + esc(p.label) + '</span><span class="meta">' + items.length + ' 个手段 · ' + esc(COST_LABEL[cost]) + ' ›</span></button>';
      }).join("")).join("");
  }
  function popHTML() {
    $("action-pop").innerHTML = '<div class="pop-heading"><span>' + esc(placeName(openPlace)) + ' · ' +
      actionRows().filter(item => item.action.place === openPlace).length + ' 个具体手段</span><button id="close-pop" aria-label="关闭手段">×</button></div>' +
      actionRows().filter(item => item.action.place === openPlace).map(methodHTML).join("");
  }
  function closePop(restore = false) {
    const old = popAnchor;
    $("action-pop").hidden = true; openPlace = null; popAnchor = null;
    document.querySelectorAll('[data-kind="place"][aria-expanded]').forEach(el => el.setAttribute("aria-expanded", "false"));
    if (restore && old) document.querySelector('.bench [data-kind="place"][data-id="' + CSS.escape(old) + '"]')?.focus();
  }
  function openPop(id, anchor, keyboard = false) {
    if (openPlace === id && selection?.kind === "place" && selection.id === id) { closePop(keyboard); choose(null); return; }
    openPlace = id; popAnchor = id;
    choose({kind:"place",id}, false);
    popHTML(); $("action-pop").hidden = false;
    const bounds = anchor?.getBoundingClientRect();
    const height = $("action-pop").offsetHeight;
    $("action-pop").style.left = "312px";
    $("action-pop").style.top = Math.max(116, Math.min(bounds?.top || 160, window.innerHeight - height - 12)) + "px";
    document.querySelector('.bench [data-kind="place"][data-id="' + CSS.escape(id) + '"]')?.setAttribute("aria-expanded", "true");
    if (keyboard) ($("action-pop").querySelector('button.execute:not(:disabled)') || $("action-pop")).focus();
  }
  function pathElement(edge, cls, clickable = true) {
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", edge.path); path.setAttribute("class", cls);
    if (clickable) {
      path.dataset.kind = "edge"; path.dataset.id = edge.semanticEdgeId || edge.id;
      path.setAttribute("role", "button"); path.setAttribute("tabindex", "0");
      path.setAttribute("aria-label", "关系：" + (edge.label || graph.edges.find(e => e.id === (edge.semanticEdgeId || edge.id))?.label || "共同支持"));
    }
    return path;
  }
  function renderMap() {
    const width = layout.width, height = layout.height;
    $("map-svg").setAttribute("viewBox", "0 0 " + width + " " + height);
    $("map-svg").setAttribute("width", width * zoom); $("map-svg").setAttribute("height", height * zoom);
    $("map-canvas").style.width = width * zoom + "px"; $("map-canvas").style.height = height * zoom + "px";
    $("node-controls").style.width = width + "px"; $("node-controls").style.height = height + "px";
    $("node-controls").style.transform = "scale(" + zoom + ")";
    $("map-svg").innerHTML = '<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="context-stroke" stroke-width="1.2"/></marker></defs>';
    for (const edge of layout.edges || layout.routes || []) {
      const id = edge.semanticEdgeId || edge.id;
      const active = transient && (transient.addedEdgeIds.includes(id) || transient.changedEdgeIds.includes(id));
      const path = pathElement(edge, "route " + edge.kind + (active ? " connecting" : ""), false);
      path.dataset.routeId = id;
      if (edge.directed !== false && !edge.supportGroupId) path.setAttribute("marker-end", "url(#arrow)");
      if (active) { const length = edge.points?.reduce((sum,p,i,a) => i ? sum + Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y) : 0, 0) || 500; path.style.setProperty("--route-length", length); }
      $("map-svg").append(path, pathElement(edge, "route-hit"));
    }
    for (const [id, routes] of Object.entries(layout.frontierRoutes || {})) {
      for (const edge of routes) {
        const path = pathElement(edge, "route frontier " + edge.kind, false); path.dataset.frontierRouteId = id; $("map-svg").append(path);
        const hit = pathElement(edge, "route-hit", false); hit.dataset.kind = "gap"; hit.dataset.id = id;
        hit.setAttribute("tabindex","0");hit.setAttribute("role","button");hit.setAttribute("aria-label", "未接通：" + (graph.frontiers.find(q => q.id === id)?.title || "已知疑问"));$("map-svg").append(hit);
      }
    }
    for (const joint of layout.supportJunctions || []) {
      if (joint.path) { const trunk = pathElement(joint,"route support",false);trunk.setAttribute("marker-end","url(#arrow)");$("map-svg").append(trunk); }
      const diamond = document.createElementNS(svgNS,"path");
      diamond.setAttribute("d","M"+joint.x+" "+(joint.y-4)+"l4 4l-4 4l-4-4Z");diamond.setAttribute("class","junction");
      diamond.dataset.kind="claim";diamond.dataset.id=joint.targetId;diamond.setAttribute("role","button");diamond.setAttribute("tabindex","0");diamond.setAttribute("aria-label",joint.title || "这些依据共同成立");$("map-svg").append(diamond);
    }
    $("node-controls").innerHTML = graph.nodes.map(node => {
      const p = layout.positions[node.id]; if (!p) return "";
      const lines = p.titleLines || p.lines || [node.title];
      return '<button class="node-control ' + esc(node.kind) + ' ' + esc(node.state) + (transient && (transient.activatedNodeIds.includes(node.id) || transient.repeatedNodeIds?.includes(node.id)) ? " activated" : "") + '"' + attrs(selectionForNode(node).kind,node.id) +
        ' aria-label="' + esc(node.title + (stateText[node.state] ? "，" + stateText[node.state] : "")) + '" style="left:' + (p.x-p.width/2) + 'px;top:' + (p.y-p.height/2) + 'px;width:' + p.width + 'px;height:' + p.height + 'px"><span class="node-glyph"></span><span class="node-title">' +
        lines.map(esc).join("<br>") + '</span><span class="node-state">' + esc(stateText[node.state] || "") + '</span></button>';
    }).join("") + (graph.frontiers || []).map(q => {
      const p = layout.frontierPositions?.[q.id]; if (!p) return "";
      return '<button class="node-control frontier-control ' + esc(q.kind) + '"' + attrs("gap",q.id) + ' aria-label="未接通：' + esc(q.title) + '" style="left:' + (p.x-p.width/2) + 'px;top:' + (p.y-p.height/2) + 'px;width:' + p.width + 'px;height:' + p.height + 'px"><span class="node-glyph"></span><span class="node-title">' + (p.titleLines || p.lines || [q.title]).map(esc).join("<br>") + '</span></button>';
    }).join("");
    $("empty-map").hidden = graph.nodes.length > 0;
    $("map-count").textContent = graph.observations.length + " 份信息 · " + graph.edges.length + " 条关系 · " + graph.frontiers.length + " 处未解";
    $("zoom-value").textContent = Math.round(zoom*100) + "%";
  }
  function applyFocus(sel = selection) {
    const focus = focusFor(sel), hasMap = focus.nodeIds.length || focus.edgeIds.length || focus.frontierIds.length;
    document.querySelectorAll(".node-control").forEach(el => {
      const id = el.dataset.id, gap = el.dataset.kind === "gap";
      const relevant = (gap ? focus.frontierIds : focus.nodeIds).includes(id);
      const selected = sel?.id === id || (!gap && focus.primaryNodeIds?.includes(id));
      el.classList.toggle("selected", !!selected); el.classList.toggle("related", !!relevant && !selected); el.classList.toggle("faded", !!hasMap && !relevant && !selected);
      el.setAttribute("aria-pressed",String(!!selected));
    });
    document.querySelectorAll("[data-route-id]").forEach(el => {
      const related = focus.edgeIds.includes(el.dataset.routeId);
      el.classList.toggle("selected", related); el.classList.toggle("dimmed", !!hasMap && !related);
    });
    document.querySelectorAll("[data-frontier-route-id]").forEach(el => {
      const related = focus.frontierIds.includes(el.dataset.frontierRouteId);
      el.classList.toggle("selected",related); el.classList.toggle("dimmed",!!hasMap && !related);
    });
    document.querySelectorAll('.bench [data-kind="place"]').forEach(el => {
      el.classList.toggle("related",focus.placeIds.includes(el.dataset.id));
      el.classList.toggle("selected",sel?.kind === "place" && sel.id === el.dataset.id);
    });
    document.querySelectorAll(".judgment-row").forEach(el => {
      const related = focus.claimIds.some(id => el.dataset.id === id || el.dataset.id === "claim:"+id);
      el.classList.toggle("related",related);el.classList.toggle("selected",sel?.kind === "claim" && (sel.id===el.dataset.id || "claim:"+sel.id===el.dataset.id));
    });
  }
  function renderOverview() {
    $("overview").innerHTML = '<h2>现在的判断</h2>' + judgmentOverview(solved,graph).map(row =>
      '<button class="judgment-row ' + esc(row.status) + (row.established ? " established" : "") + '"' + attrs("claim",row.id) + '><span>' + esc(row.title) + '</span><span class="state">' + esc(row.statusLabel || (row.established ? "已有依据" : "尚未形成")) + '</span></button>').join("");
  }
  function renderDetails() {
    const box = $("details"), focus = focusFor();
    if (!selection) {
      box.innerHTML = '<div class="eyebrow">' + (session.stopped ? "本局已收手" : "这次委托") + '</div><h3 class="detail-title">它经历过什么，还有哪些拿不准？</h3><p class="detail-copy">点一条信息、道路或缺口，回看依据，决定是否继续调查。</p>' +
        (graph.frontiers.length ? '<div class="section">已知中仍有这些疑问</div>' + questionButtons(graph.frontiers) : '<p class="small" style="margin-top:16px">尚无由已知内容提出的疑问。</p>') +
        (session.stopped ? '<div class="section">本局结账</div><p class="small">' + esc(billText(session)) + '</p><p class="detail-copy">' + esc(finalNote || "保留当前判断与未知。") + '</p>' : "");
      return;
    }
    if (selection.kind === "place" || selection.kind === "action") {
      const rows = actionRows().filter(item => selection.kind === "place" ? item.action.place === selection.id : item.action.id === selection.id);
      box.innerHTML = '<div class="eyebrow">调查手段</div><h3 class="detail-title">' + esc(selection.kind === "place" ? placeName(selection.id) : rows[0]?.action.name) + '</h3>' +
        (focus.nodeIds.length ? '<p class="small">地图标出了本局已有的相关信息。</p>' : '<p class="small">当前还没有可联动的已知结果。查看手段不会提前得到信息。</p>') + rows.map(methodHTML).join("");
      return;
    }
    if (selection.kind === "gap") {
      const q = graph.frontiers.find(item => item.id === selection.id);
      if (!q) { selection=null; renderDetails(); return; }
      box.innerHTML = '<div class="eyebrow">已知中尚未接通的地方</div><h3 class="detail-title">' + esc(q.title) + '</h3><p class="detail-copy">' + esc(q.explanation) + '</p><div class="section">这个问题从哪里来</div>' + nodeButtons(q.anchorIds) +
        (q.actionIds.length ? '<button id="show-methods" class="detail-button">' + (showMethods ? "收起调查方法" : "有哪些方法可以了解它") + '</button>' +
          (showMethods ? actionRows().filter(item => q.actionIds.includes(item.action.id)).map(methodHTML).join("") : "") :
          '<p class="reason">当前没有进一步核对它的手段，可以把这处未知保留在判断中。</p>');
      return;
    }
    if (selection.kind === "edge") {
      const edge = graph.edges.find(item => item.id === selection.id);
      if (!edge) { selection=null;renderDetails();return; }
      const group = graph.supportGroups?.find(group => group.edgeIds.includes(edge.id));
      box.innerHTML = '<div class="eyebrow">已有依据的关系</div><h3 class="detail-title">' + esc(edge.label) + '</h3><p class="detail-copy">' + esc(edge.details) + '</p>' +
        (group ? '<p class="source-note">' + esc(group.title) + '：同一汇流口的依据需要共同成立。' + (group.alternativeSet ? '不同入路可各自形成证明，不把两条未完成路线拼成一条。' : '') + '</p>' : '') +
        '<div class="section">连接的内容</div>' + nodeButtons([edge.from,edge.to]) + '<div class="section">关系的原始依据</div>' + sourceButtons(edge.sourceIds);
      return;
    }
    const node = nodeById(selection.id), raw = observation(selection.id);
    if (selection.kind === "claim") {
      const row = judgmentOverview(solved,graph).find(row => row.id===selection.id || row.claimId===selection.id);
      const claimKey = row?.claimId || selection.id.replace(/^claim:/,"");
      const shownNode = node || graph.nodes.find(n => n.id === "claim:"+claimKey);
      box.innerHTML = '<div class="eyebrow">判断 / ' + esc(row?.statusLabel || "尚未形成") + '</div><h3 class="detail-title">' + esc(shownNode?.title || row?.title) + '</h3><p class="detail-copy">' +
        esc(shownNode?.summary || "已有信息尚不足以形成这项判断。可以回看相关依据，自行决定是否继续。") + '</p>' +
        (focus.sourceIds.length ? '<div class="section">本局相关依据</div>' + sourceButtons(focus.sourceIds) : "") +
        (claimKey === "coherentDecisionProfile" ? '<div class="section">判断涉及的方面</div>' + renderFacets() : "") +
        '<div class="section">相关的未解之处</div>' + questionButtons(graph.frontiers.filter(q => focus.frontierIds.includes(q.id)));
      return;
    }
    const sourceIds = raw && !node ? [raw.id || raw.observationId] : node?.sourceIds || focus.sourceIds;
    const edges = graph.edges.filter(e => focus.edgeIds.includes(e.id));
    box.innerHTML = '<div class="eyebrow">已得信息' + (node?.state && stateText[node.state] ? " / "+esc(stateText[node.state]) : "") + '</div><h3 class="detail-title">' + esc(node?.title || raw?.title || "原始记录") + '</h3><p class="detail-copy">' + esc(node?.summary || raw?.summary || "这份调查记录已保留，可以回查其关系和来源。") + '</p>' +
      (edges.length ? '<div class="section">与已有信息怎样相连</div>' + edges.map(e => '<button class="detail-button"' + attrs("edge",e.id) + '><strong>' + esc(e.label) + '</strong>' + esc(nodeById(e.from===node?.id?e.to:e.from)?.title) + '</button>').join("") : "") +
      '<div class="section">这里仍拿不准的地方</div>' + questionButtons(graph.frontiers.filter(q => focus.frontierIds.includes(q.id))) +
      '<div class="section">回查原始依据</div>' + sourceButtons(sourceIds);
  }
  function renderFacets() {
    const facets = judgmentFacets(solved,actionRows());
    const rows = Array.isArray(facets) ? facets : Object.entries(facets || {}).map(([id,value]) => ({id,...(typeof value==="object"?value:{statusLabel:value})}));
    return rows.map(f => '<div class="facet-row"><span>' + esc(f.title || f.label || f.name || f.id) + '</span><span class="muted">' + esc(f.stateLabel || f.statusLabel || f.text || f.status || "") + '</span></div>').join("");
  }
  function render(reposition = false, updateFrame = false) {
    if (historyIndex === null) { viewSession=session; solved=solve(session);graph=buildGraph(solved,session); }
    else { viewSession=frames[historyIndex].session; solved=frames[historyIndex].solved;graph=frames[historyIndex].graph; }
    if (reposition || !layout) layout=layoutGraph(graph,{width:$("map-scroll").clientWidth,height:Math.max(460,$("map-scroll").clientHeight),previous:layout});
    if (historyIndex === null) liveLayout=layout;
    if (updateFrame) frames[session.log.length]={session:clone(session),solved:clone(solved),graph:clone(graph),layout:clone(layout)};
    $("stage-title").textContent=(session.stopped?"已收手 · ":"")+(STAGE_SEMANTICS[solved.stage]?.name || solved.stage);
    $("resource-status").textContent="还剩 "+(viewSession.budget-viewSession.log.length)+" 步 / 共 "+viewSession.budget+" 步 · "+billText(viewSession);
    $("budget").value=session.budget; $("budget").disabled=!!session.log.length || session.stopped;
    $("stop-button").disabled=session.stopped || historyIndex!==null;
    $("notice").textContent=historyIndex===null?notice:"正在回看第 "+historyIndex+" 步 · "+(historyIndex?ACTION_BY_ID.get(session.log[historyIndex-1].actionId).name:"开局")+"。点「回到本局」继续。";
    renderBench();renderMap();renderOverview();renderDetails();applyFocus();
  }
  function choose(next, toggle = true) {
    if (toggle && next && selection?.kind===next.kind && selection.id===next.id) next=null;
    selection=next;hovered=null;showMethods=false;$("hover-tip").hidden=true;
    renderDetails();applyFocus();
    if (openPlace) popHTML();
  }
  function execute(id) {
    if (historyIndex!==null) return;
    const before=graph,result=take(session,id);
    if (!result.ok) { notice=result.why;$("notice").textContent=notice;return; }
    closePop();clearTimeout(animationTimer);
    solved=solve(session);graph=buildGraph(solved,session);transient=diffGraphs(before,graph);
    const o=graph.observations.find(o=>o.observationId===result.observationId || o.id===result.observationId);
    const target=o?.nodeId || graph.nodes.find(n=>n.sourceIds?.includes(result.observationId))?.id;
    const repeated=before.observations.some(o=>(o.observationId || o.id)===result.observationId);
    transient.repeatedNodeIds=repeated && target ? [target] : [];
    selection=target?selectionForNode(nodeById(target)):o?.edgeIds?.length?{kind:"edge",id:o.edgeIds[0]}:{kind:"evidence",id:result.observationId};
    const count=transient.addedEdgeIds.length+transient.changedEdgeIds.length;
    notice=ACTION_BY_ID.get(id).name+"："+(repeated || result.kind==="repeat"?"已有记录已回看，没有新增一份证据。":transient.activatedNodeIds.length?transient.activatedNodeIds.length+" 份旧信息获得了解释条件。":count?count+" 条关系接通或得到进一步印证。":"信息已保留。");
    showMethods=false;render(true,true);
    document.querySelector('.bench [data-kind="place"][data-id="' + CSS.escape(ACTION_BY_ID.get(id).place) + '"]')?.focus({preventScroll:true});
    animationTimer=setTimeout(()=>{transient=null;document.querySelectorAll(".connecting,.activated").forEach(el=>el.classList.remove("connecting","activated"));},900);
  }
  function showHistory(index) {
    closePop();clearTimeout(animationTimer);transient=null;selection=null;hovered=null;historyIndex=index;layout=clone(frames[index].layout);
    $("history-dialog").close();render(false);
    $("notice").innerHTML='<span>'+esc($("notice").textContent)+'</span> <button id="history-live" class="quiet">回到本局</button>';
  }
  function returnLive() {
    closePop();hovered=null;$("hover-tip").hidden=true;
    historyIndex=null;layout=liveLayout;selection=null;notice="已回到本局。";$("history-dialog").close();render(false);
  }
  function restart() {
    closePop();clearTimeout(animationTimer);transient=null;session=newSession(session.budget);viewSession=session;
    historyIndex=null;selection=null;hovered=null;layout=null;liveLayout=null;frames=[];zoom=1;finalNote="";$("final-note").value="";
    notice="新的一局。从左侧任选一处开始。";$("restart-dialog").close();render(true,true);
  }
  function activateElement(el, keyboard=false) {
    const kind=el.dataset.kind,id=el.dataset.id;
    if (kind==="place") openPop(id,el,keyboard);
    else { if (!el.closest("#action-pop")) closePop();choose({kind,id}); }
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("button,[role=button]");
    if (button?.dataset.close) {$(button.dataset.close).close();return;}
    if (button?.dataset.take) {execute(button.dataset.take);return;}
    if (button?.dataset.history!==undefined) {showHistory(Number(button.dataset.history));return;}
    if (button?.id==="close-pop"){closePop(true);return;}
    if (button?.id==="show-methods"){showMethods=!showMethods;renderDetails();return;}
    if (button?.id==="history-live"){returnLive();return;}
    if (button?.dataset.kind){activateElement(button,event.detail===0);return;}
    if (event.target.closest("#map-scroll") && !event.target.closest(".node-control,.route-hit")) {closePop();choose(null);}
    else if (!event.target.closest("#action-pop") && !event.target.closest(".bench")) closePop();
  });
  document.addEventListener("keydown",event=>{
    if (event.key==="Escape") {
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();if(openPlace)closePop(true);else choose(null);return;
    }
    const el=event.target.closest('[role="button"][data-kind]');
    if (el && !el.matches("button") && (event.key==="Enter" || event.key===" ")) {event.preventDefault();activateElement(el,true);}
  });
  document.addEventListener("pointerover",event=>{
    const el=event.target.closest('#node-controls [data-kind],#map-svg [data-kind],.bench [data-kind],.judgment-row');
    if (!el || el.contains(event.relatedTarget)) return;
    hovered={kind:el.dataset.kind,id:el.dataset.id};applyFocus(hovered);
    const q=graph.frontiers.find(q=>q.id===hovered.id), n=nodeById(hovered.id), e=graph.edges.find(e=>e.id===hovered.id);
    const label=q?.title || n?.title || e?.label || (hovered.kind==="place"?placeName(hovered.id):"点击回查依据");
    $("hover-tip").textContent=label;$("hover-tip").hidden=false;
    const r=el.getBoundingClientRect();$("hover-tip").style.left=Math.min(window.innerWidth-310,Math.max(8,r.left))+"px";$("hover-tip").style.top=Math.max(8,Math.min(window.innerHeight-55,r.top-38))+"px";
  });
  document.addEventListener("pointerout",event=>{
    const el=event.target.closest('[data-kind]');
    if (el && !el.contains(event.relatedTarget)) {hovered=null;$("hover-tip").hidden=true;applyFocus();}
  });
  $("clear-selection").onclick=()=>{closePop();choose(null);};
  $("legend-button").onclick=()=>{$("legend").hidden=!$("legend").hidden;$("legend-button").setAttribute("aria-expanded",String(!$("legend").hidden));};
  $("zoom-in").onclick=()=>{zoom=Math.min(1.5,Math.round((zoom+.1)*10)/10);renderMap();applyFocus();};
  $("zoom-out").onclick=()=>{zoom=Math.max(.8,Math.round((zoom-.1)*10)/10);renderMap();applyFocus();};
  $("budget").onchange=()=>{setBudget(session,$("budget").value);notice="开局步数已设置。";render(false,true);};
  $("brief-button").onclick=()=>{$("brief-dialog").showModal();};
  $("restart-button").onclick=()=>{$("restart-dialog").showModal();};
  $("confirm-restart").onclick=restart;
  $("stop-button").onclick=()=>{closePop();$("stop-preview").innerHTML='<p>'+esc(STAGE_SEMANTICS[solved.stage]?.name || solved.stage)+'</p><p class="small">已调查 '+session.log.length+' 次 · '+esc(billText(session))+'</p><p class="small">当前 '+graph.frontiers.length+' 处疑问仍可保留。确认收手后可以回看，不再调查。</p>';$("stop-dialog").showModal();};
  $("confirm-stop").onclick=()=>{clearTimeout(animationTimer);transient=null;session.stopped=true;finalNote=$("final-note").value;selection=null;notice="本局已收手。判断、依据和未解之处均已保留。";$("stop-dialog").close();render(false,true);};
  $("history-button").onclick=()=>{$("history-list").innerHTML='<button class="history-step" data-history="0">开局 · 尚无信息</button>'+session.log.map((step,i)=>'<button class="history-step'+(historyIndex===i+1?' current':'')+'" data-history="'+(i+1)+'">'+(i+1)+'. '+esc(ACTION_BY_ID.get(step.actionId).name)+'</button>').join("");$("history-dialog").showModal();};
  $("return-live").onclick=returnLive;
  let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(true),150);});
  render(true,true);
  /* Read-only inspection surface for integration checks; no action or state mutators. */
  window.fusionSnapshot=()=>clone({session,viewSession,solved,graph,layout,selection,hovered,historyIndex,zoom,openPlace,transient});
}
