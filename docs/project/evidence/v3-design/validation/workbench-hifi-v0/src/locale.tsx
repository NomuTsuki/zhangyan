import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, formatText } from './locale-text.mjs';

export type Language = 'zh' | 'en';
const preferenceKey = 'zhangyan.hifi.language';
function initialLanguage(): Language {
  const query = new URLSearchParams(location.search).get('lang');
  if (query === 'en' || query === 'zh') return query;
  try { return localStorage.getItem(preferenceKey) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
}
const LanguageContext = createContext({ language: 'zh' as Language, setLanguage: (_language: Language) => {},
  t: (text: any): string => String(text ?? ''), f: (text: string, values: Record<string, any>): string => formatText(text, values, 'zh') });

/** Display preference only: never sent to the session worker or saved in evidence. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? 'Zhangyan — Appraisal Workbench' : '掌眼 · 鉴定工作台';
    try { localStorage.setItem(preferenceKey, language); } catch { /* Offline/private browsing may deny storage. */ }
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (text: any) => translate(text, language),
    f: (text: string, values: Record<string, any>) => formatText(text, values, language) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
