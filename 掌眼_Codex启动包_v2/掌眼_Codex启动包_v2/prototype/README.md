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

## 当前范围

- 单案件、单路由；
- 8 个必要页面状态和 1 个证据发现浮层；
- 证据、NPC 回应和结算均为明确标注的 Mock；
- 不包含正式数值规则、自然语言输入、存档或生产 API。

## 常用命令

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`：构建并检查关键原型内容是否能服务端渲染
- `npm run lint`：检查代码规范
