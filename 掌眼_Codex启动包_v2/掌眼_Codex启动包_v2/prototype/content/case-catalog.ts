import { seededUnit } from "../game/random.ts";
import type { CaseDefinition, TruthVariantId } from "../game/types.ts";
import { calligraphyCase } from "./calligraphy.ts";
import { lacquerBoxCase } from "./lacquer-box.ts";
import { porcelainCase } from "./porcelain.ts";

const playerLacquerCase: CaseDefinition = {
  ...lacquerBoxCase,
  caseVersion: "2.0.0",
  requiresAppraisal: true,
};

export const PLAYER_CASE_CATALOG: CaseDefinition[] = [
  playerLacquerCase,
  porcelainCase,
  calligraphyCase,
];

export type SeededSession = Readonly<{
  seed: number;
  caseDefinition: CaseDefinition;
  truthVariantId: TruthVariantId;
}>;

export function createSeededSession(
  catalog: CaseDefinition[],
  seed: number,
): SeededSession {
  if (!Number.isInteger(seed)) throw new Error("局号必须是整数");
  if (catalog.length === 0) throw new Error("案例目录不能为空");
  const caseIndex = Math.floor(seededUnit(seed, 0, "session:case") * catalog.length);
  const caseDefinition = catalog[caseIndex];
  const truthIds = caseDefinition.judgmentModel.hypothesisOrder;
  const truthIndex = Math.floor(
    seededUnit(seed, 0, `session:${caseDefinition.id}:truth`) * truthIds.length,
  );
  return {
    seed,
    caseDefinition,
    truthVariantId: truthIds[truthIndex],
  };
}
