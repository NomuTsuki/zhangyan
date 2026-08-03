import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const releaseManifestUrl = new URL(
  "../../../../release/v1-teacher-handoff.json",
  import.meta.url,
);

const canonicalSource =
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html";
const excludedRuntimeArtifacts = [
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_低保真交互原型.html",
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_数值实验台.html",
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
});
