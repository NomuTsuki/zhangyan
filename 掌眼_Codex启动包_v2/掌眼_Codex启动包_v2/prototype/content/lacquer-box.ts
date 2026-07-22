export const lacquerBoxCase = {
  id: "lacquer-box-001",
  title: "民国漆木首饰盒",
  seller: {
    name: "刘先生",
    summary: "急于出售，但对器物经历有所保留",
    openingPrice: "¥8,800",
    openingPriceNote: "原型占位，待产品确认",
  },
  actionBudget: 4,
  claims: [
    { id: "claim-inherited", text: "这是家里祖传下来的。", topic: "来源" },
    {
      id: "claim-never-restored",
      text: "这件东西从来没有修过。",
      topic: "修复历史",
    },
  ],
  evidence: {
    id: "modern-adhesive-trace",
    name: "现代胶痕",
    topic: "修复历史",
    strength: "强证据",
    detail: "接口残留的透明胶体形态与旧漆层不一致，支持近现代拆修判断。",
    contradicts: "claim-never-restored",
  },
  response: {
    before: "这件东西从来没有修过。",
    after: "至少我接手以后没有修过，之前可能处理过。",
  },
  npcStatePreview: [
    { id: "pressure", label: "压力", before: 26, after: 54, reason: "强证据命中" },
    { id: "trust", label: "信任", before: 58, after: 61, reason: "专业表达" },
    { id: "dealIntent", label: "成交意愿", before: 72, after: 66, reason: "风险被指出" },
    { id: "control", label: "控制感", before: 68, after: 42, reason: "必须回应矛盾" },
  ],
  truth: [
    "木胎为旧物，年代为民国晚期",
    "表面经过现代翻修",
    "锁扣后配，底款后刻",
    "卖家父亲于 1998 年从旧货市场购买",
  ],
  ignoredEvidence: ["现代锁扣", "1998 年旧货市场购买票据"],
  outcomes: [
    {
      id: "conditional-testing",
      label: "送检后付款",
      short: "把不确定性转化为检测条件",
      result: "暂不付款，双方约定第三方检测后再议。",
      assessment: "风险覆盖充分",
    },
    {
      id: "risk-discount",
      label: "风险折价",
      short: "按翻修与后配风险调整价格",
      result: "以风险折价条件继续谈判，价格为原型占位。",
      assessment: "风险部分覆盖",
    },
    {
      id: "reject",
      label: "拒绝交易",
      short: "在信息不足时及时止损",
      result: "礼貌结束本次交易，不承担当前不确定性。",
      assessment: "风险完全规避",
    },
  ],
} as const;

export type OutcomeId = (typeof lacquerBoxCase.outcomes)[number]["id"];
