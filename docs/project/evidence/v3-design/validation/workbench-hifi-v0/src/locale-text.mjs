import ui from './locales/en-ui.mjs';
import caseCopy from './locales/en-case.mjs';
import materialCopy from './locales/en-materials.mjs';

export const english = Object.freeze({ ...ui, ...caseCopy, ...materialCopy });
const cleanedEnglish = Object.fromEntries(Object.entries(english).map(([key,value]) => [key.replace(/声明/g,'注明'),value]));
/** Source-language keys localise display copy; domain IDs and source records stay intact. */
export function translate(value, language = 'zh') {
  const text = String(value ?? '');
  if (language !== 'en' || !text) return text;
  if (Object.hasOwn(english, text)) return english[text];
  const clean = text.trim();
  if (Object.hasOwn(english, clean)) return english[clean];
  if (Object.hasOwn(cleanedEnglish, clean)) return cleanedEnglish[clean];
  // These source summaries contain retained authoring notes. The Chinese
  // material view already omits the same note and presents relation states separately.
  const visible = clean.replace(/具体图像与特征值尚未制作；此处沿用已设定的案例内容。/g,'').replace(/\s*当前：.*$/,'');
  if (visible !== clean) return translate(visible, language);
  for (const [prefix, label] of [['这一步要用到：', 'This investigation needs: '], ['还需要：', 'Still needed: '],
    ['已记录：', 'Recorded: '], ['这次核对未能完成：', 'The investigation could not finish: ']]) {
    if (text.startsWith(prefix)) return label + text.slice(prefix.length).split('、').map(s => translate(s, language)).join('; ');
  }
  const common = /^(.*)，需要下列依据共同成立。$/.exec(text);
  if (common) return `${translate(common[1], language)} requires all the following evidence together.`;
  // Two source sentences are combined when a held comparison awaits attribution.
  if (text.includes('。 ')) {
    const parts=text.split(/(?<=。)\s+/).map(s=>translate(s,language));
    if(parts.every(s=>! /\p{Script=Han}/u.test(s))) return parts.join(' ');
  }
  // Joined billing items are display strings, never interpreted by the solver.
  if (text.includes(' · ')) return text.split(' · ').map(s => translate(s, language)).join(' · ');
  const bill = /^(免费|低|中|高) × (\d+)$/.exec(text);
  if (bill) return `${translate(bill[1], language)} × ${bill[2]}`;
  return text;
}
export function formatText(key, values, language = 'zh') {
  if (language === 'en' && key === '{records} 份记录 · {relations} 条关联')
    return `${values.records} ${values.records===1?'record':'records'} · ${values.relations} ${values.relations===1?'connection':'connections'}`;
  if (language === 'en' && key === '{count} 项原始来源')
    return `${values.count} original ${values.count===1?'source':'sources'}`;
  return translate(key, language).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
