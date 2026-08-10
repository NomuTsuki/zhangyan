import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const releaseManifestUrl = new URL(
  "../../../../release/v1-teacher-handoff.json",
  import.meta.url,
);
const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

const canonicalSource =
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html";
const V1_SHA256 = "8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B";
const excludedRuntimeArtifacts = [
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_低保真交互原型.html",
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_数值实验台.html",
];
const teacherSources = [
  {
    source: "docs/teacher/00_请先看.txt",
    packageName: "00_请先看.txt",
    role: "entry",
  },
  {
    source: "docs/teacher/01_掌眼_V1_项目说明.html",
    packageName: "01_掌眼_V1_项目说明.html",
    role: "project-description",
  },
  {
    source: "docs/teacher/02_掌眼_V1_演示说明.html",
    packageName: "02_掌眼_V1_演示说明.html",
    role: "demo-guide",
  },
];
const generatedFiles = [
  {
    packageName: "04_版本与校验.txt",
    role: "verification",
  },
];

test("V1 release manifest selects only the canonical teacher runtime", async () => {
  let rawManifest;
  try {
    rawManifest = await readFile(releaseManifestUrl, "utf8");
  } catch {
    assert.fail("release/v1-teacher-handoff.json must define the V1 authority boundary");
  }

  const manifest = JSON.parse(rawManifest);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.releaseId, "v1.0.0-teacher-handoff");
  assert.deepEqual(manifest.canonicalRuntime, {
    source: canonicalSource,
    packageName: "03_掌眼_V1_教师演示.html",
  });
  assert.deepEqual(
    [...manifest.excludedRuntimeArtifacts].sort(),
    [...excludedRuntimeArtifacts].sort(),
  );
  assert.deepEqual(manifest.teacherSources, teacherSources);
  assert.deepEqual(manifest.generatedFiles, generatedFiles);
  assert.ok(
    !manifest.excludedRuntimeArtifacts.includes(manifest.canonicalRuntime.source),
    "canonical runtime cannot also be excluded",
  );

  const packageNames = [
    manifest.canonicalRuntime.packageName,
    ...manifest.teacherSources.map((entry) => entry.packageName),
    ...manifest.generatedFiles.map((entry) => entry.packageName),
  ];
  assert.equal(
    new Set(packageNames).size,
    packageNames.length,
    "teacher package target names must be unique",
  );
  assert.deepEqual(
    [...packageNames].sort(),
    [
      "00_请先看.txt",
      "01_掌眼_V1_项目说明.html",
      "02_掌眼_V1_演示说明.html",
      "03_掌眼_V1_教师演示.html",
      "04_版本与校验.txt",
    ].sort(),
    "teacher package must remain the exact five-file allowlist",
  );
});

test("V1 teacher package sources exist and remain offline self-contained", async () => {
  const manifest = JSON.parse(await readFile(releaseManifestUrl, "utf8"));
  const sourceEntries = [manifest.canonicalRuntime, ...manifest.teacherSources];
  const sourceContents = new Map();

  for (const entry of sourceEntries) {
    const sourcePath = resolve(repositoryRoot, ...entry.source.split("/"));
    try {
      sourceContents.set(entry.source, await readFile(sourcePath, "utf8"));
    } catch {
      assert.fail(`teacher package source must exist: ${entry.source}`);
    }
  }

  for (const entry of manifest.teacherSources.filter(({ source }) =>
    source.endsWith(".html"),
  )) {
    const html = sourceContents.get(entry.source);
    assert.match(html, /^<!doctype html>/i, `${entry.source} must be HTML5`);
    assert.match(html, /<html\s+lang="zh-CN"/i, `${entry.source} must declare zh-CN`);
    assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i);
    assert.doesNotMatch(html, /<link\b[^>]*\brel=["']?stylesheet/i);
    assert.doesNotMatch(html, /<(?:img|audio|video|source)\b[^>]*\bsrc\s*=/i);
    assert.doesNotMatch(html, /@import\s+(?:url\s*\()?\s*["']?https?:/i);
    assert.doesNotMatch(html, /(?:[A-Z]:\\|file:\/\/\/)/i);
  }
});

test("V1 canonical teacher runtime remains byte-frozen", async () => {
  const canonicalPath = resolve(repositoryRoot, ...canonicalSource.split("/"));
  const canonicalBytes = await readFile(canonicalPath);

  assert.equal(
    createHash("sha256").update(canonicalBytes).digest("hex").toUpperCase(),
    V1_SHA256,
  );
});
