import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { AUTHORITY_SCENARIOS, captureAuthorityBaseline } from "../tests/helpers/authority-scenarios.mjs";

const fixtureUrl = new URL("../tests/fixtures/v2-numeric-authority-baseline.json", import.meta.url);
const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

if (!process.argv.includes("--approve-baseline")) {
  throw new Error("Baseline writes require --approve-baseline; a failed comparison must never regenerate automatically.");
}

const capture = captureAuthorityBaseline();
const snapshotsJson = JSON.stringify(capture.snapshots);
const fixture = {
  ...capture,
  provenance: {
    sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim(),
    v1FrozenCommit: execFileSync("git", ["rev-parse", "v1.0.0-teacher-handoff^{}"], { cwd: repositoryRoot, encoding: "utf8" }).trim(),
    scenarioCount: AUTHORITY_SCENARIOS.length,
    snapshotsSha256: createHash("sha256").update(snapshotsJson).digest("hex"),
  },
};

await writeFile(fixtureUrl, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
