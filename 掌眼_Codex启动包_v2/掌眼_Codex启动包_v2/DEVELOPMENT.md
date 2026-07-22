# 《掌眼》开发入口

## 当前阶段

项目处于 Sprint 0：民国漆木首饰盒低保真交互原型。现阶段只验证信息架构和核心路径，不实现正式规则、美术、存档或线上 API。

## 目录

- `docs/`：产品与开发规格；
- `examples/`：首案数据；
- `schemas/`：公共数据结构草案；
- `references/`：流程与视觉参考；
- `prototype/`：可运行的手机竖屏网页原型。

## 本地运行

需要 Node.js 22.13 或更高版本。

如果只需要给老师演示，可直接双击：

`prototype/public/掌眼_低保真交互原型.html`

该文件包含全部样式与交互，不需要安装 Node.js，也不依赖网络。

```bash
cd prototype
npm install
npm run dev
```

构建验证：

```bash
cd prototype
npm run build
npm test
```

## 开发规则

1. 先阅读 `AGENTS.md`；
2. UI 不直接修改 NPC 数值；
3. 案件事实与界面分离；
4. 原型 Mock 必须明确标注；
5. 已决定事项写入对应文档，未决定事项写入 `docs/11_OPEN_QUESTIONS.md`；
6. 每项完成工作需说明内容、文件、验收、测试、风险和下一步。
