import { createPlayerCase } from "./create-player-case.ts";

export const porcelainCase = createPlayerCase({
  id: "porcelain-bowl-001",
  title: "青花折枝纹碗",
  sellerName: "周女士",
  sellerSummary: "经营旧货多年，对款识很有信心，但不愿轻易承认修补",
  openingPrice: 100,
  profileId: "experienced-reseller",
  profileLabel: "经验较多、态度谨慎的旧货商",
  beliefSummary: "卖家依据底款和进货渠道判断它有年代，但没有做过材料检测。",
  personalitySummary: "熟悉常见交易话术，对无依据压价戒备，对具体工艺证据会重新考虑。",
  publicTraits: ["经验较多", "态度谨慎", "看重证据"],
  urgency: 0.42,
  riskAversion: 0.55,
  truths: [
    { id: "modern-imitation", label: "现代仿品", summary: "胎釉、款识与磨损均为现代仿古处理。", value: 30, grade: "C", facts: ["胎体烧结均匀", "款识为现代摹写", "磨损集中在人工处理位置"] },
    { id: "later-revival", label: "后仿旧器", summary: "器物有一定年代，但并非款识指向的时期，且经历修补。", value: 85, grade: "A", facts: ["胎釉具有自然老化", "底款晚于所署年代", "口沿存在后期修补"] },
    { id: "period-authentic", label: "时代真品", summary: "胎、釉、青料和款识处于一致的历史层。", value: 170, grade: "SS", facts: ["胎釉老化一致", "青料晕散符合工艺特征", "足墙磨损与款识同层"] },
  ],
  targets: [
    { id: "glaze", label: "釉面", short: "观察气泡、光泽与磨损", hint: "自然使用痕迹应与釉面老化连续。", topic: "胎釉年代", sourceGroup: "surface", dimensions: ["material-era"], findings: {
      "modern-imitation": { name: "均匀化学磨光", detail: "光泽衰减过于均匀，凹处没有对应积垢。", inference: "更接近现代仿古处理。" },
      "later-revival": { name: "旧釉与口沿补配", detail: "主体釉面自然，但口沿局部颜色和光泽断开。", inference: "旧器可能经历后期修补。" },
      "period-authentic": { name: "釉面老化连续", detail: "气泡、细痕和积垢随器形变化而连续。", inference: "支持胎釉处于同一历史层。" },
    } },
    { id: "mark", label: "底款", short: "核对笔法与足墙磨损", hint: "款识不能脱离胎釉和足墙单独断代。", topic: "款识年代", sourceGroup: "bottom", dimensions: ["provenance-craft-identity"], findings: {
      "modern-imitation": { name: "款识浮在新釉之上", detail: "款料边缘锐利，与足墙磨损不连续。", inference: "支持现代摹写。" },
      "later-revival": { name: "后仿款笔法", detail: "款识已有磨损，但结构晚于所署时期。", inference: "器物有旧感，款识却不能直接采信。" },
      "period-authentic": { name: "款识与足墙同层", detail: "款料沉入釉层，磨损与足墙连续。", inference: "支持款识和器物年代一致。" },
    } },
    { id: "body", label: "胎足", short: "查看修足、胎色与黏砂", hint: "胎足通常比表面纹饰更难伪装。", topic: "制作工艺", sourceGroup: "joint", dimensions: ["component-era-consistency", "modern-restoration"], findings: {
      "modern-imitation": { name: "机械修足纹", detail: "足底旋削纹连续且缺少自然磕碰。", inference: "支持现代批量制作。" },
      "later-revival": { name: "旧胎上的后补材料", detail: "胎足自然老化，口沿却检测到较新补配层。", inference: "支持旧器后修。" },
      "period-authentic": { name: "胎足工艺相互印证", detail: "修足节奏、胎色与黏砂关系一致。", inference: "支持时代工艺判断。" },
    } },
  ],
  provenanceClaim: "这是我从一批老藏家旧物里收来的，底款很开门。",
  conditionClaim: "我只做过清洁，没有修补。",
  provenanceQuestion: "这件瓷器的进货来源和以前的持有记录是什么？",
  conditionQuestion: "口沿、胎足或釉面是否做过补配处理？",
  testLabel: "胎釉成分对比",
  testDescription: "比较胎釉材料与修补层，不直接读取隐藏真相。",
  testCost: 8,
  knowledge: [
    { title: "款识不是身份证", body: "款识需要与胎、釉、足墙和磨损同时成立。" },
    { title: "修补不等于全假", body: "局部修补影响品相和价值，但不能单独否定旧胎。" },
  ],
});
