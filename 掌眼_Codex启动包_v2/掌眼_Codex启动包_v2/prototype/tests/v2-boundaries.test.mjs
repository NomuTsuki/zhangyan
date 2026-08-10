import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const V1_SHA256 = "8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B";
const v1 = new URL("../public/掌眼_高保真教师演示.html", import.meta.url);
const v2 = new URL("../public/掌眼_V2_高保真演示.html", import.meta.url);
const legacyHtml = new URL("../public/掌眼_低保真交互原型.html", import.meta.url);
const generator = new URL("../generate-standalone.mjs", import.meta.url);
const v2Manifest = new URL("../../../../release/v2-development.json", import.meta.url);

async function sha256(url) {
  return createHash("sha256").update(await readFile(url)).digest("hex").toUpperCase();
}

test("V2 build has a distinct output and V1 canonical remains byte-frozen", async () => {
  assert.equal(await sha256(v1), V1_SHA256);
  assert.notEqual(fileURLToPath(v1), fileURLToPath(v2));
  await access(v2);
});

test("legacy standalone generator fails before changing its snapshot", () => {
  const before = readFileSync(legacyHtml);
  const result = spawnSync(process.execPath, [fileURLToPath(generator)], { encoding: "utf8" });
  const after = readFileSync(legacyHtml);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /archived V1 low-fidelity generator is disabled/i);
  assert.deepEqual(after, before);
});

test("V2 development manifest identifies the non-public runtime and preserved V1 runtime", async () => {
  const manifest = JSON.parse(await readFile(v2Manifest, "utf8"));

  assert.deepEqual(manifest, {
    schemaVersion: 1,
    releaseId: "v2-development",
    publicationStatus: "not-public",
    identity: {
      rulesetId: "zhangyan-core",
      rulesetVersion: "2.0.0-alpha.1",
      caseId: "lacquer-box-001",
      caseVersion: "1.0.0",
    },
    runtime: "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_V2_高保真演示.html",
    preservedV1Runtime: "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html",
  });
});
