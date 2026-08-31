/* 探针:把求解器在中局的真实输出形状打出来,供投影层照着设计。
   只读,不改任何冻结字节。跑法:node probe.mjs > probe-out.txt */
import fs from "node:fs";
import { events, thresholds, expectedProfile, claimScopeRequirements,
         actionContracts, proofRoleContracts, unknownRegistry } from
  "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture } from "../first-ceramic-author-scenarios-v0/solver.mjs";
import { ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";

function liveFixture(acquired) {
  return {
    id: "live", thresholds, expectedProfile, claimScopeRequirements,
    actionContracts, proofRoleContracts, unknownRegistry, playerChoice: "CONTINUE",
    events: acquired, orders: [acquired.map((e) => e.observationId)], expected: {},
  };
}
const solve = (acq) => solveFixture(liveFixture(acq), acq);

function run(ids) {
  let acq = [], facts = new Set();
  for (const id of ids) {
    const a = ACTION_BY_ID.get(id);
    acq = [...acq, events[a.outcome(facts)]];
    facts = new Set(solve(acq).coverage.facts);
  }
  return solve(acq);
}

/* 中局:物证路线六步 */
const r = run(["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY",
               "A.OBSERVE.REGION_DECOR", "A.IMAGE.XRAY", "A.MAP.REGION_CONTINUITY"]);

/* 早拿后懂:射线先行,只三步,用来看意义未定观察长什么样 */
const rEarly = run(["A.IMAGE.XRAY", "A.OBSERVE.WHOLE", "A.OBSERVE.BASE"]);

let out = "";
const dump = (label, v) => { out += "=== " + label + " ===\n" + JSON.stringify(v, null, 1) + "\n\n"; };

out += "########## 中局:物证六步 ##########\n\n";
out += "=== top-level keys ===\n" + Object.keys(r).join("\n") + "\n\n";
dump("evidence", r.evidence);
out += "=== coverage keys ===\n" + Object.keys(r.coverage).join("\n") + "\n\n";
dump("coverage.proofRoleWitnesses", r.coverage.proofRoleWitnesses);
dump("coverage.observations", r.coverage.observations);
dump("coverage.archiveRelations", r.coverage.archiveRelations);
dump("claims", r.claims);
dump("conflicts", r.conflicts);
out += "stage=" + r.stage + "\n";
out += "majorProofPaths=" + JSON.stringify(r.coverage.majorProofPaths) + "\n";
out += "g3BlockingUnknowns=" + JSON.stringify(r.coverage.g3BlockingUnknowns) + "\n";
out += "unknowns=" + JSON.stringify(r.coverage.unknowns) + "\n\n";
dump("stopping", r.stopping);

out += "########## 早拿后懂:射线先行三步 ##########\n\n";
dump("evidence", rEarly.evidence);
dump("coverage.proofRoleWitnesses", rEarly.coverage.proofRoleWitnesses);
out += "stage=" + rEarly.stage + "\n\n";

out += "########## 静态合同 ##########\n\n";
dump("proofRoleContracts", proofRoleContracts);
dump("actionContracts", actionContracts);

fs.writeFileSync("probe-out.txt", out, "utf8");
console.log("written probe-out.txt " + out.length + " bytes");
