import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const fixtureUrl = new URL(
  "./fixtures/v2-numeric-authority-baseline.json",
  import.meta.url,
);
const scenariosUrl = new URL("./helpers/authority-scenarios.mjs", import.meta.url);

test("authority scenarios match the approved pre-refactor semantic baseline", async () => {
  const expected = JSON.parse(await readFile(fixtureUrl, "utf8"));
  const { captureAuthorityBaseline } = await import(scenariosUrl);
  const actual = captureAuthorityBaseline();

  assert.deepEqual(actual.snapshots, expected.snapshots);
});
