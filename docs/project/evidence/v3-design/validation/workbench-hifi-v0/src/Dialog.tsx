import { useEffect, useRef, type ReactNode } from 'react';

export default function Dialog({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current!;el.showModal();return()=>el.close();},[]);
  return <dialog ref={ref} className={`sheet-dialog ${wide?'wide-dialog':''}`} aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <div className="dialog-paper"><header className="dialog-heading"><h2>{title}</h2><button className="close-button" aria-label="关闭" onClick={onClose}>×</button></header>{children}</div>
  </dialog>;
}
