/* 只为浏览器实跑验证用的静态服务。产物 prototype.html 本身是可双击的单文件,
   不依赖本文件;自动化工具不允许访问 file:// 才需要它。跑法:node serve.mjs */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.argv[2] ?? 8794);
const ROOT = process.cwd();

http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(ROOT, rel === "/" ? "prototype.html" : rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end("no"); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    const ct = file.endsWith(".png") ? "image/png" : "text/html; charset=utf-8";
    res.writeHead(200, { "Content-Type": ct });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}/`));
