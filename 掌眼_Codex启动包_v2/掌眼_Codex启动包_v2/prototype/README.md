# 《掌眼》低保真交互原型

用于演示“民国漆木首饰盒”从来客、观察、证据、对质到交易复盘的手机竖屏核心路径。

## Prerequisites

- Node.js `>=22.13.0`

## 本地运行

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

打开开发服务后访问终端显示的本地地址。桌面端会显示手机画布，手机端会铺满可用宽度。

也可以直接离线打开：

- `public/掌眼_低保真交互原型.html`：玩家主流程与开发调试侧栏；
- `public/掌眼_数值实验台.html`：厚尾价值、后验报价、NPC错价与有限议价批量模拟。

## 当前范围

- 单案件、单路由；
- 8 个必要页面状态和 1 个证据发现浮层；
- 证据发现与交易结算仍为明确标注的 Mock；
- “专业 + 指出矛盾 + 现代胶痕”已接入首个可复现规则切片，NPC 四项状态、阶段、改口阈值和原因日志均由规则输出；
- 独立数值实验台使用固定 seed 比较常态/市场扰动、三档证据、三类 NPC 和四种报价策略；全部参数仍为待平衡工作假设；
- 不包含完整数值平衡、自然语言输入、存档或生产 API。

## 常用命令

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`：构建并检查服务端渲染、单文件逻辑与规则确定性/边界
- `npm run lint`：检查代码规范
