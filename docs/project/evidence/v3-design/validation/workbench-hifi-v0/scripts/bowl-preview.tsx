// Component-only verification harness. review required; not a game entry point.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import BowlScene from '../src/BowlScene';
import { preloadBowlArtwork } from '../src/bowl-art';
import '../src/styles.css';
const events: {id:string;anchor:string|null}[] = [];
function Harness() {
  const [selected, setSelected] = useState<string|null>(null);
  const [related, setRelated] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [visible, setVisible] = useState<string[]>([]);
  const height = Number(new URLSearchParams(location.search).get('height')) || 680;
  return <><div style={{display:'grid',gridTemplateColumns:'minmax(340px,1.04fr) minmax(500px,1.55fr) minmax(306px,.94fr)',height}}>
    <section className="object-panel"><div className="object-heading"><h1>器物检视</h1></div>
      <BowlScene selectedTargetId={selected} relatedTargetIds={related?['OBJ_D','OBJ_F']:[]} disabled={disabled} onOrientationChange={setVisible} onSelectTarget={(id,anchor)=>{events.push({id,anchor:anchor?.getAttribute('data-bowl-target')||null});setSelected(id);}} />
    </section><div style={{padding:24,color:'#333'}}>器物专项验证视图<br/>只使用真实组件，不装载游戏状态。
      <button data-clear onClick={()=>setSelected(null)}>清除选择</button><button data-related onClick={()=>setRelated(x=>!x)}>切换关联</button><button data-disabled onClick={()=>setDisabled(x=>!x)}>切换禁用</button>
      <pre data-events>{JSON.stringify(events)}</pre><pre data-visible>{JSON.stringify(visible)}</pre><pre data-selected>{selected}</pre>
    </div></div></>;
}
await preloadBowlArtwork();createRoot(document.getElementById('bowl-check-root')!).render(<Harness/>);
