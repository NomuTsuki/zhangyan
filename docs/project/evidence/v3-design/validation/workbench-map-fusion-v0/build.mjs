import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const hash = input => createHash("sha256").update(input).digest("hex");
const modules = new Map(), ordered = [], visiting = new Set();
async function bundle(file) {
  file = resolve(file);
  if (visiting.has(file)) throw new Error("Cyclic module: " + file);
  if (modules.has(file)) return modules.get(file);
  const ns = file === resolve(here, "ui.mjs") ? "UI" : "M" + modules.size;
  const item = { ns, path:relative(here,file).replaceAll("\\","/") };
  modules.set(file,item);visiting.add(file);
  const raw = await readFile(file,"utf8");
  item.sha256 = hash(raw);
  const imports = [...raw.matchAll(/^import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?\s*/gm)];
  let code = raw;
  for (const match of imports) {
    const dep = await bundle(resolve(dirname(file), match[2]));
    const bindings = match[1].split(",").map(value => value.trim().replace(/\s+as\s+/g,": ")).filter(Boolean).join(", ");
    code = code.replace(match[0],"const { " + bindings + " } = " + dep.ns + ";\n");
  }
  const names = [...code.matchAll(/^export\s+(?:async\s+)?(?:const|let|function|class)\s+([\w$]+)/gm)].map(m=>m[1]);
  code = code.replace(/^export\s*\{([^}]+)\};?/gm,(_,list)=>{
    names.push(...list.split(",").map(value=>value.trim()).filter(Boolean).map(value=>{
      const parts=value.split(/\s+as\s+/);return parts.length===2?parts[1]+": "+parts[0]:parts[0];
    }));return "";
  }).replace(/^export\s+(?=(?:async\s+)?(?:const|let|function|class)\b)/gm,"");
  if (/^\s*(import|export)\s/m.test(code)) throw new Error("Unsupported module syntax: "+file);
  item.code = "const " + ns + " = (() => {\n" + code + "\nreturn {" + [...new Set(names)].join(",") + "};\n})();";
  visiting.delete(file);ordered.push(item);return item;
}
await bundle(resolve(here,"ui.mjs"));
const template = await readFile(resolve(here,"template.html"),"utf8");
const stamp = { builtAt:new Date().toISOString(), templateSha256:hash(template), modules:ordered.map(({ns,path,sha256})=>({ns,path,sha256})) };
const script = ordered.map(item=>item.code).join("\n\n");
new vm.Script(script+"\nUI.mount;");
const output=template.replace("/*__STAMP__*/","const STAMP = "+JSON.stringify(stamp,null,2)+";").replace("/*__MODULES__*/",script);
if (output.includes("/*__")) throw new Error("Unresolved template marker");
await writeFile(resolve(here,"prototype.html"),output,"utf8");
await writeFile(resolve(here,"build-stamp.json"),JSON.stringify(stamp,null,2)+"\n","utf8");
console.log("Built fusion prototype: "+ordered.length+" modules, "+Buffer.byteLength(output)+" bytes.");
