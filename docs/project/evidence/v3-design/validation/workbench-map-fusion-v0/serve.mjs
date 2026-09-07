import http from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here=dirname(fileURLToPath(import.meta.url));
const port=Number(process.argv[2]||4180);
http.createServer(async(req,res)=>{
  if (!["/","/prototype.html"].includes(req.url?.split("?")[0])) {res.writeHead(404);res.end("Not found");return;}
  try {res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"});res.end(await readFile(resolve(here,"prototype.html")));}
  catch(err) {res.writeHead(500);res.end(err.message);}
}).listen(port,"127.0.0.1",()=>console.log("Fusion prototype: http://127.0.0.1:"+port));
