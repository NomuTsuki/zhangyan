import { createPlayerCase } from "./create-player-case.ts";

export const calligraphyCase = createPlayerCase({
  id: "calligraphy-scroll-001",
  title: "山水题跋立轴",
  sellerName: "沈先生",
  sellerSummary: "相信家族口述，对印章和题跋极有信心",
  openingPrice: 140,
  profileId: "confident-heir",
  profileLabel: "重视传承、判断坚定的持有人",
  beliefSummary: "卖家把家族保存时间、印章和题跋视为原作依据。",
  personalitySummary: "不急于脱手，愿意谈细节，但对直接否定家族记忆较敏感。",
  publicTraits: ["判断坚定", "不急出售", "重视传承"],
  urgency: 0.25,
  riskAversion: 0.4,
  truths: [
    { id: "modern-reproduction", label: "现代复制", summary: "画心、印章和做旧纸张均为现代复制。", value: 25, grade: "D", facts: ["线条存在复制网点", "纸张为现代做旧", "印泥渗化晚于画心"] },
    { id: "historical-copy", label: "旧摹本与后配装裱", summary: "画心为有年代的学习摹本，装裱、题签和部分印章后配。", value: 120, grade: "A", facts: ["画心具有自然老化", "笔法为历史摹本", "装裱与题签明显后配"] },
    { id: "attributed-original", label: "可靠传承原作", summary: "纸、墨、笔法、印章和流传记录能够交叉对应。", value: 260, grade: "SSS", facts: ["纸墨年代相符", "关键笔法具有稳定个性", "印章与旧藏记录互证"] },
  ],
  targets: [
    { id: "paper", label: "纸面", short: "观察纤维、折痕与污渍", hint: "自然老化应穿过墨层和折痕，而非停留在表面。", topic: "纸墨年代", sourceGroup: "surface", dimensions: ["material-era"], findings: {
      "modern-reproduction": { name: "表面喷染做旧", detail: "污色停留在纸面，折痕内部反而更白。", inference: "支持现代做旧纸张。" },
      "historical-copy": { name: "画心自然老化", detail: "纤维脆化和折痕连续，但装裱纸明显较新。", inference: "支持旧画心与后配装裱。" },
      "attributed-original": { name: "纸墨老化同步", detail: "纤维、墨色和折痕关系连续。", inference: "支持纸墨处于一致历史层。" },
    } },
    { id: "seal", label: "印章题签", short: "核对印泥、位置与旧藏记录", hint: "印章必须与画心、题跋和来源链相互印证。", topic: "印章来源", sourceGroup: "bottom", dimensions: ["provenance-craft-identity"], findings: {
      "modern-reproduction": { name: "扫描复制印纹", detail: "边缘出现规则网点，朱色没有渗入纤维。", inference: "支持现代复制。" },
      "historical-copy": { name: "旧印与后配题签", detail: "一方旧印自然，题签用纸和浆糊却明显较新。", inference: "支持旧摹本后配装裱。" },
      "attributed-original": { name: "印章与记录互证", detail: "印泥渗化、钤盖位置和旧藏照片一致。", inference: "支持可靠流传链。" },
    } },
    { id: "brushwork", label: "笔墨结构", short: "观察转折、复笔和墨色层次", hint: "临摹可以复制形状，却较难复制稳定的运笔节奏。", topic: "笔墨结构", sourceGroup: "joint", dimensions: ["component-era-consistency", "modern-restoration"], findings: {
      "modern-reproduction": { name: "复制网点与补线", detail: "线条边缘出现网点，局部以墨线二次描补。", inference: "支持机械复制后手工修饰。" },
      "historical-copy": { name: "有功力的旧摹笔", detail: "运笔自然，但关键转折重复范本而缺少个性变化。", inference: "支持有年代的学习摹本。" },
      "attributed-original": { name: "笔墨节奏稳定", detail: "转折、飞白和复笔形成连续的个人习惯。", inference: "支持原作判断。" },
    } },
  ],
  provenanceClaim: "这幅画在家里至少放了三代，印章和题跋都在。",
  conditionClaim: "只重新装裱过一次，画心没有动。",
  provenanceQuestion: "家族保存记录、旧照片或题跋来源能否对应？",
  conditionQuestion: "画心、印章和装裱分别在什么时候处理过？",
  testLabel: "纸墨纤维检测",
  testDescription: "比较纸张、墨层和装裱材料的年代关系。",
  testCost: 10,
  knowledge: [
    { title: "旧不等于原作", body: "历史摹本同样可能很旧，仍需观察笔法和来源链。" },
    { title: "装裱是另一条时间线", body: "后配装裱不必然伤及画心真伪，但会改变来源判断。" },
  ],
});
