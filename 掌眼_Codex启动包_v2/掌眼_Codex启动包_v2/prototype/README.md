# 《掌眼》交互原型

用于演示“民国漆木首饰盒”从来客、观察、证据、询问到交易复盘的手机竖屏核心路径。

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

- `public/掌眼_高保真教师演示.html`：V1 canonical，按字节保留；
- `public/掌眼_V2_高保真演示.html`：V2 high-fidelity HTML，只由构建产生；
- `public/掌眼_低保真交互原型.html`：历史规则与调试快照，只用于回看早期设计，不代表当前规则；
- `public/掌眼_数值实验台.html`：独立批量实验工具，参数仍是工作假设，不代表正式运行时。

## 权威分类

| Identity | Owner | Direction |
|---|---|---|
| 生产规则权威 | `game/` + `content/` | 可被投影、测试和生成链读取；不读取下列身份 |
| 显示投影 | `hifi/presentation.ts` + `game/projections.ts` | 只读规则状态，不反向修改规则 |
| 实验模型 | `public/掌眼_数值实验台.html` | 隔离实验，不证明生产一致或平衡 |
| 调试轨迹 | `TurnRecord` / `CalculationTrace` | 解释输出，不参与下一轮计算 |
| 历史资产 | V1 canonical、低保真 HTML/client | 按字节保留，不继续生成生产规则 |
| 测试例证 | fixtures 与固定断言 | 检测漂移，不反向定义参数 |
| 生成产物 | V2 high-fidelity HTML | 只由构建产生并携带 provenance |

测试分为 `consistency`、`design-example`、`balance-simulation`、`human-experience` 四层。当前自动套件只覆盖前两层与隔离实验台内部一致性，不把它们称为真人体验或平衡证据。

## 当前范围

- 单案件、单路由；
- 高保真首案包含开店、来客、调查、交易和复盘五个玩家阶段，以及只读证据簿与证据发现浮层；
- 调查行动点与议价容量分别管理；正式报价后锁定调查，但议价容量耗尽后仍可接受或拒绝；
- 玩家通过具体证据询问 NPC，不再使用抽象的“完整说明 / 只强调部分”按钮；
- NPC 四项精确状态、阶段、改口阈值和原因日志只显示在桌面开发侧栏；
- 玩家复盘采用 `D—SSS` 等级与分项结果，不显示旧的 0—100 客观分；
- 独立数值实验台使用固定 seed 比较常态/市场扰动、三档证据、三类 NPC 和四种报价策略；全部参数仍为待平衡工作假设；
- 不包含完整数值平衡、自然语言输入、存档、生产 API 或微信平台能力。

## 常用命令

- `npm run dev`：启动现有 React 开发版
- `npm run dev:hifi`：启动高保真教师演示开发版
- `npm run build`：生成高保真单文件，并验证完整应用构建
- `npm run build:hifi`：只生成 `public/掌眼_V2_高保真演示.html`
- `npm test`：构建并检查服务端渲染、三份单文件、规则确定性与信息边界
- `npm run test:hifi`：只运行高保真规则、展示边界与单文件测试
- `npm run lint`：检查代码规范
