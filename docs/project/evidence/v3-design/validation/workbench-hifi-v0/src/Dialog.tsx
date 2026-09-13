import { useLanguage } from './locale';
import { useEffect, useRef, type ReactNode } from 'react';

export default function Dialog({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
  const { t } = useLanguage();
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current!;el.showModal();return()=>el.close();},[]);
  return <dialog ref={ref} className={`sheet-dialog ${wide?'wide-dialog':''}`} aria-label={t(title)} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <div className="dialog-paper"><header className="dialog-heading"><h2>{t(title)}</h2><button className="close-button" aria-label={t("关闭")} onClick={onClose}>×</button></header>{children}</div>
  </dialog>;
}
