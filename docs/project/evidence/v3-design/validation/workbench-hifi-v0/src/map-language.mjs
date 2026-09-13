import { translate } from './locale-text.mjs';

// Short display labels retain the same acquired IDs and authored glyph positions.
// Explicit line breaks protect English words; only text placement may change.
const labels = {
 'obs.current.whole':['Form & visible','repairs'], 'obs.current.base':['Foot traces'], 'obs.phase.t1':['Old photo'],
 'obs.corpus.identity':['Period check'], 'obs.corpus.identity.repeat':['Repeat comparison'], 'obs.structure.xray.early':['Current internal','structure'],
 'obs.structure.major.cross-time':['Changes in','comparable areas'], 'obs.structure.major.documented-cross-time':['Records–object','comparison'],
 'interpretation:photo-change':['Changes in this bowl','between two dates'], 'interpretation:archive-change':['Recorded treatment','matched to this bowl'],
 'interpretation:photo-repair':['Staple repairs already','visible in the photograph'],
 'obs.accident.major':['Damage records'], 'obs.phase.t3':['Later treatment','records'],
 'claim:identity':['Late-18th-century','export porcelain'], 'claim:majorReassembly':['Major reassembly','established'],
 'claim:threePhase':['Three phases','of restoration'], 'claim:coherentDecisionProfile':['Coherent account','for a decision'],
 'obs.appearance.restore':['Surface reworking'], 'obs.surface.no-signal.unresolved':['No UV signal','within test limits'],
 'obs.key-material.substrate-readings':['Substrate at','key locations'], 'obs.key-material.layer-sequence':['Layer sequence at','key interfaces'],
 'obs.surface.point-layering':['Layering in','test windows'], 'obs.surface.resolved':['Extent of','surface treatment'],
 'obs.stability.resolved':['Support &','display conditions'], 'obs.documentation.resolved':['Traceable','ownership history'],
 'obs.object.continuity':['Photograph–object','verification'],
 'obs.archive.t2.object-attribution':['Damage record','attribution'], 'obs.archive.t2.current-corroboration':['Damage event','corroboration'],
 'obs.archive.t3.object-attribution':['Later record','attribution'], 'obs.archive.t3.current-corroboration':['Later treatment','corroboration'],
};
export function wrapEnglish(text, max = 27) {
 const lines = [''];
 for (const word of String(text).split(/\s+/)) {
   if (lines.at(-1) && lines.at(-1).length + word.length + 1 > max) lines.push(word);
   else lines[lines.length-1] += (lines.at(-1) ? ' ' : '') + word;
 }
 return lines;
}
export function localizeMapLayout(layout, language) {
 if (language !== 'en') return layout;
 const local = item => {
   const lines=item.state !== 'contested' && labels[item.id] ? labels[item.id] : wrapEnglish(translate(item.title || item.text,'en'));
   return { ...item, title: translate(item.title,'en'), subline: translate(item.subline,'en'),
     lines, displayText:lines.join(' '), wordWrap:true };
 };
 return { ...layout,
   nodes: layout.nodes.map(n => ({ ...local(n), ...(n.box ? {fontSize:18,lineHeight:24} : {fontSize:21,lineHeight:29}) })),
   frontiers: layout.frontiers.map(n => ({ ...local(n),fontSize:18,lineHeight:26 })),
   roadLabels: layout.roadLabels.map(n => ({ ...local(n),fontSize:16.5,lineHeight:24 })),
 };
}
