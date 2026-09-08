/* Copy only the four revised method explanations into this fusion entry. */
import { ACTION_SEMANTICS as original, STAGE_SEMANTICS } from '../evidence-semantics-v0/semantics.mjs';
export { STAGE_SEMANTICS };
export const ACTION_SEMANTICS = {
  ...original,
  'A.VERIFY.OBJECT_CONTINUITY': {
    doesWhat:'把已经取得的旧照片与现器底足等对应特征逐项核对。两份材料都在手后，才能执行这次核验。',
    whyShort:'确认照片中的对象是否就是眼前这只碗。',
    whyLong:'这次报告只处理本照片与现器的关系。照片中的旧锔痕从取得时就能看见；核验相符后，才可归入这只碗的早期历史。它不替其他事故记录或后期档案完成归属，也不决定今日X射线观察是否可用。',
    gotWhat:'本照片与现器对应特征的核验报告。',
  },
  'A.IMAGE.XRAY': {
    doesWhat:'多角度逐区成像，记录当前可读范围内的隐藏接合、填料候选与瓷片边界。',
    whyShort:'先知道当前内部结构，再结合其他材料解释它的历史。',
    whyLong:'成像直接来自眼前这只碗，当前结构不等待旧照片归属核验。观察只覆盖声明可读区域；没有读清的地方仍保留。成像本身不负责给全部接合断代、证明原片归属或补绘忠实度。',
    gotWhat:'声明范围内的当前结构观察，取得后即可回查。',
  },
  'A.LOCATE.HISTORIC_IMAGE': {
    doesWhat:'取得既有案例中的19世纪末旧照片，保留照片中可见的足部瑕疵与旧锔痕。',
    whyShort:'照片内容先取得，再核实它与眼前这只碗的关系。',
    whyLong:'照片中的内容不因归属未定而消失。与现器对应特征核验相符后，旧锔痕才成为本器早期修复的依据。旧外观照片不能证明未显示的内部接缝当时不存在；具体图片与对应特征值尚未制作。',
    gotWhat:'一份旧照片及其可见内容，归属关系单独核实。',
  },
  'A.MAP.REGION_CONTINUITY': {
    doesWhat:'明确选择已经在手的历史材料与现器记录，只比较它们能够共同说明的区域。',
    whyShort:'先取得范围明确的比较报告，再依据归属解释本器历史。',
    whyLong:'旧照片路线使用旧照、现器修补观察与当前成像；事故记录路线使用该记录与现器观察。报告可先于相应归属核验取得；归属成立后，原报告获得历史用途，不需要重新调查。两种材料都有时，明确选择本次使用哪一份。X射线只补当前结构，不填补旧照片不可见的内部范围。',
    gotWhat:'指定材料与当前记录的区域比较报告；报告与本器历史用途分别保存。',
  },
};
