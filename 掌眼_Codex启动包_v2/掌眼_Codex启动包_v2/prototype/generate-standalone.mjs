import { readFile, writeFile } from "node:fs/promises";

import { lacquerBoxCase } from "./content/lacquer-box.ts";

const css = (await readFile(new URL("./app/globals.css", import.meta.url), "utf8"))
  .replace('@import "tailwindcss";', "");
const clientScript = await readFile(
  new URL("./standalone/client.js", import.meta.url),
  "utf8",
);
const outputUrl = new URL("./public/掌眼_低保真交互原型.html", import.meta.url);
const serializedCase = JSON.stringify(lacquerBoxCase).replaceAll("</script", "<\\/script");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>掌眼｜民国漆木首饰盒低保真原型</title>
  <meta name="description" content="《掌眼》共享行动循环、NPC纺锤决策与双层结算低保真原型">
  <style>${css}</style>
</head>
<body>
  <main class="prototype-stage" id="prototype-stage">
    <section class="phone-shell" aria-label="《掌眼》手机竖屏低保真原型">
      <header class="app-header">
        <div class="brand-row">
          <div>
            <span class="brand-mark">掌眼</span>
            <span class="brand-subtitle">鉴器 · 辨言 · 定交易</span>
          </div>
          <span class="case-code">单文件 · 离线可用</span>
        </div>
        <ol class="progress-strip" id="progress-root" aria-label="案件进度"></ol>
      </header>
      <div class="screen" id="app-root" aria-live="polite"></div>
      <footer class="app-footer">
        <span>共享行动循环原型</span><span>390 × 844 基准</span>
      </footer>
    </section>
    <aside class="debug-rail" id="debug-root" aria-label="开发调试与规则进程"></aside>
  </main>
  <script>window.__ZHANGYAN_CASE__ = ${serializedCase};
${clientScript}</script>
</body>
</html>
`;

await writeFile(outputUrl, html, "utf8");
console.log(`Generated ${outputUrl.pathname}`);
