import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server renders the integrated Zhangyan prototype", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>掌眼｜民国漆木首饰盒低保真原型<\/title>/i);
  assert.match(html, /今日开门，第一位来客已到/);
  assert.match(html, /接待刘先生/);
  assert.match(html, /共享行动循环原型/);
  assert.match(html, /规则、状态与回放/);
  assert.match(html, /本版重点验证共享行动点、动态证据、NPC纺锤决策与客观结算/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});
